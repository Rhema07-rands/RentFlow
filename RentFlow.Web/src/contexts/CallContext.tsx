import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE } from '../config/api';
import { useAuth } from './AuthContext';
import { useCustomAlert } from './AlertContext';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export type CallType = 'audio' | 'video';

export interface CallLogItem {
  id: string;
  contactId: string;
  name: string;
  type: 'missed' | 'incoming' | 'outgoing';
  callType: CallType;
  time: string;
  duration?: number;
}

interface CallContextType {
  callState: CallState;
  callType: CallType;
  remoteUserId: string | null;
  callerName: string | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaker: boolean;
  callDuration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callHistory: CallLogItem[];
  startCall: (targetUserId: string, targetName: string, type?: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  endCall: () => void;
  rejectCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  clearHistory: () => void;
}

const CallContext = createContext<CallContextType>({
  callState: 'idle',
  callType: 'audio',
  remoteUserId: null,
  callerName: null,
  isMuted: false,
  isCameraOff: false,
  isSpeaker: true,
  callDuration: 0,
  localStream: null,
  remoteStream: null,
  callHistory: [],
  startCall: async () => {},
  acceptCall: async () => {},
  endCall: () => {},
  rejectCall: () => {},
  toggleMute: () => {},
  toggleCamera: () => {},
  toggleSpeaker: () => {},
  clearHistory: () => {},
});

export const useCall = () => useContext(CallContext);

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const DEFAULT_CALL_LOGS: CallLogItem[] = [
  {
    id: '1',
    contactId: '00000000-0000-0000-0000-000000000001',
    name: 'Adeola Properties',
    type: 'incoming',
    callType: 'audio',
    time: 'Yesterday, 2:15 PM',
    duration: 145,
  },
  {
    id: '2',
    contactId: '00000000-0000-0000-0000-000000000003',
    name: 'Lagos Luxury Living',
    type: 'outgoing',
    callType: 'video',
    time: 'Oct 21, 4:30 PM',
    duration: 312,
  },
  {
    id: '3',
    contactId: '00000000-0000-0000-0000-000000000002',
    name: 'ChiChi Homes',
    type: 'missed',
    callType: 'audio',
    time: 'Oct 19, 11:10 AM',
  },
];

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const { showAlert } = useCustomAlert();

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [callerName, setCallerName] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callHistory, setCallHistory] = useState<CallLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('rf_call_history');
      return saved ? JSON.parse(saved) : DEFAULT_CALL_LOGS;
    } catch {
      return DEFAULT_CALL_LOGS;
    }
  });

  const hubRef = useRef<signalR.HubConnection | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteUserRef = useRef<string | null>(null);
  const callTypeRef = useRef<CallType>('audio');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addHistoryLog = useCallback((log: Omit<CallLogItem, 'id' | 'time'>) => {
    const newItem: CallLogItem = {
      ...log,
      id: Date.now().toString(),
      time: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    };
    setCallHistory(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem('rf_call_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const cleanupMedia = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  const acquireMedia = async (type: CallType): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Could not access camera/microphone, falling back to audio or simulated stream:', err);
      if (type === 'video') {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = audioOnly;
          setLocalStream(audioOnly);
          return audioOnly;
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const createPeerConnection = useCallback((targetId: string, stream: MediaStream | null) => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && hubRef.current?.state === signalR.HubConnectionState.Connected) {
        hubRef.current.invoke('SendIceCandidate', targetId, event.candidate).catch(console.error);
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // Connect to CallHub when user is authenticated
  useEffect(() => {
    if (!token || !user) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/callhub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.on('IncomingCall', (callerId: string, incomingName: string, incomingCallType: string = 'audio') => {
      const cType: CallType = incomingCallType === 'video' ? 'video' : 'audio';
      remoteUserRef.current = callerId;
      callTypeRef.current = cType;
      setRemoteUserId(callerId);
      setCallerName(incomingName || 'RentFlow User');
      setCallType(cType);
      setCallDuration(0);
      setCallState('ringing');
    });

    connection.on('CallAccepted', async (responderId: string) => {
      setCallState('connected');
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Caller initiates WebRTC Offer
      const pc = createPeerConnection(responderId, localStreamRef.current);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await connection.invoke('SendOffer', responderId, offer);
      } catch (e) {
        console.error('Error creating WebRTC offer:', e);
      }
    });

    connection.on('ReceiveOffer', async (callerId: string, offer: RTCSessionDescriptionInit) => {
      const pc = createPeerConnection(callerId, localStreamRef.current);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await connection.invoke('SendAnswer', callerId, answer);
      } catch (e) {
        console.error('Error handling WebRTC offer:', e);
      }
    });

    connection.on('ReceiveAnswer', async (_responderId: string, answer: RTCSessionDescriptionInit) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('Error setting remote answer:', e);
        }
      }
    });

    connection.on('ReceiveIceCandidate', async (_senderId: string, candidate: RTCIceCandidateInit) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    });

    connection.on('CallEnded', () => {
      cleanupMedia();
      setCallState('ended');
      setTimeout(() => {
        setCallState('idle');
        setRemoteUserId(null);
      }, 1800);
    });

    connection.start()
      .then(() => {
        hubRef.current = connection;
      })
      .catch(err => console.error('SignalR CallHub error:', err));

    return () => {
      connection.stop();
      hubRef.current = null;
    };
  }, [token, user, cleanupMedia, createPeerConnection]);

  const startCall = async (targetUserId: string, targetName: string, type: CallType = 'audio') => {
    remoteUserRef.current = targetUserId;
    callTypeRef.current = type;
    setRemoteUserId(targetUserId);
    setCallerName(targetName);
    setCallType(type);
    setCallDuration(0);
    setCallState('calling');

    addHistoryLog({
      contactId: targetUserId,
      name: targetName,
      type: 'outgoing',
      callType: type,
    });

    await acquireMedia(type);

    if (hubRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await hubRef.current.invoke('CallUser', targetUserId, user?.name || 'RentFlow User', type);
      } catch (e) {
        console.error('Failed to invoke CallUser:', e);
      }
    } else {
      showAlert('Calling Mode', 'SignalR call signaling triggered. Waiting for recipient...');
    }
  };

  const acceptCall = async () => {
    if (!remoteUserRef.current) return;
    await acquireMedia(callTypeRef.current);

    setCallState('connected');
    setCallDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    addHistoryLog({
      contactId: remoteUserRef.current,
      name: callerName || 'RentFlow User',
      type: 'incoming',
      callType: callTypeRef.current,
    });

    if (hubRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        await hubRef.current.invoke('AcceptCall', remoteUserRef.current);
      } catch (e) {
        console.error('Error accepting call:', e);
      }
    }
  };

  const endCall = () => {
    if (remoteUserRef.current && hubRef.current?.state === signalR.HubConnectionState.Connected) {
      hubRef.current.invoke('EndCall', remoteUserRef.current).catch(console.error);
    }
    cleanupMedia();
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setRemoteUserId(null);
    }, 1500);
  };

  const rejectCall = () => {
    if (remoteUserRef.current) {
      addHistoryLog({
        contactId: remoteUserRef.current,
        name: callerName || 'RentFlow User',
        type: 'missed',
        callType: callTypeRef.current,
      });
      if (hubRef.current?.state === signalR.HubConnectionState.Connected) {
        hubRef.current.invoke('EndCall', remoteUserRef.current).catch(console.error);
      }
    }
    cleanupMedia();
    setCallState('idle');
    setRemoteUserId(null);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(prev => !prev);
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isCameraOff;
      });
    }
    setIsCameraOff(prev => !prev);
  };

  const toggleSpeaker = () => {
    setIsSpeaker(prev => !prev);
  };

  const clearHistory = () => {
    setCallHistory([]);
    localStorage.removeItem('rf_call_history');
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        remoteUserId,
        callerName,
        isMuted,
        isCameraOff,
        isSpeaker,
        callDuration,
        localStream,
        remoteStream,
        callHistory,
        startCall,
        acceptCall,
        endCall,
        rejectCall,
        toggleMute,
        toggleCamera,
        toggleSpeaker,
        clearHistory,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
