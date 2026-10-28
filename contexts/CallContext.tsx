import React, { createContext, useContext } from 'react';

// ─── Types ───────────────────────────────────────────────────────────
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface CallContextType {
  callState: CallState;
  remoteUserId: string | null;
  callerName: string | null;
  isMuted: boolean;
  isSpeaker: boolean;
  callDuration: number;
  startCall: (targetUserId: string, myName: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  endCall: () => void;
  rejectCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
}

const CallContext = createContext<CallContextType>({
  callState: 'idle',
  remoteUserId: null,
  callerName: null,
  isMuted: false,
  isSpeaker: false,
  callDuration: 0,
  startCall: async () => {},
  acceptCall: async () => {},
  endCall: () => {},
  rejectCall: () => {},
  toggleMute: () => {},
  toggleSpeaker: () => {},
});

export const useCall = () => useContext(CallContext);

// WebRTC + SignalR is disabled until we build the native dev client.
// This provider is a no-op stub so the rest of the UI compiles cleanly.
export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <CallContext.Provider
      value={{
        callState: 'idle',
        remoteUserId: null,
        callerName: null,
        isMuted: false,
        isSpeaker: false,
        callDuration: 0,
        startCall: async () => {},
        acceptCall: async () => {},
        endCall: () => {},
        rejectCall: () => {},
        toggleMute: () => {},
        toggleSpeaker: () => {},
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
