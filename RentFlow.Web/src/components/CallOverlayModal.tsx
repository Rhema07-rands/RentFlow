import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, ShieldCheck } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import { getInitials } from '../config/api';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const CallOverlayModal: React.FC = () => {
  const {
    callState,
    callType,
    callerName,
    remoteUserId,
    isMuted,
    isCameraOff,
    isSpeaker,
    callDuration,
    localStream,
    remoteStream,
    acceptCall,
    endCall,
    rejectCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, callType]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = !isSpeaker;
    }
  }, [remoteStream, callState, isSpeaker]);

  if (callState === 'idle') return null;

  const displayName = callerName || remoteUserId || 'RentFlow User';
  const initials = getInitials(displayName);

  const getStatusText = () => {
    switch (callState) {
      case 'calling':
        return callType === 'video' ? 'Video Calling...' : 'Audio Calling...';
      case 'ringing':
        return callType === 'video' ? 'Incoming Video Call' : 'Incoming Audio Call';
      case 'connected':
        return formatTime(callDuration);
      case 'ended':
        return 'Call Ended';
      default:
        return 'Connecting...';
    }
  };

  const statusColor =
    callState === 'connected' ? '#10B981' : callState === 'ended' ? '#EF4444' : '#38BDF8';

  return (
    <div className="fixed inset-0 z-[9000] bg-[#0F172A]/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 md:p-12 overflow-hidden animate-in fade-in duration-200">
      {/* Hidden audio element for remote WebRTC audio stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Decorative background rings */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#38BDF8]/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-16 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Top Encryption Bar */}
      <div className="relative z-10 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="text-emerald-400 text-xs font-semibold tracking-wide">
          End-to-End Encrypted {callType === 'video' ? 'Video' : 'Voice'} Call
        </span>
      </div>

      {/* Main Content Area: Video Streams or Avatar Ring */}
      {callType === 'video' && (callState === 'connected' || callState === 'calling') ? (
        <div className="relative z-10 w-full max-w-4xl flex-1 my-6 rounded-3xl overflow-hidden bg-[#1E293B] border border-white/10 shadow-2xl flex items-center justify-center">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center border-2 mb-4 animate-pulse-ring"
                style={{ borderColor: statusColor }}
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#38BDF8] to-blue-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                  {initials}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#F8FAFC]">{displayName}</h2>
              <p className="text-sm text-[#94A3B8] mt-1">{getStatusText()}</p>
            </div>
          )}

          {/* Picture-in-Picture Local Camera */}
          <div className="absolute bottom-4 right-4 w-40 sm:w-52 aspect-video rounded-2xl overflow-hidden bg-[#0F172A] border-2 border-[#38BDF8]/50 shadow-xl">
            {localStream && !isCameraOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#1E293B] text-[#94A3B8]">
                <VideoOff className="w-6 h-6 mb-1" />
                <span className="text-[11px] font-medium">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-medium">
              You
            </div>
          </div>

          {/* Floating Status Pill on Video */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#0F172A]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
            <span className="text-xs font-bold text-[#F8FAFC]">{displayName}</span>
            <span className="text-xs text-[#94A3B8]">• {getStatusText()}</span>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center my-auto">
          <div
            className={`w-40 h-40 rounded-full flex items-center justify-center border-2 mb-6 transition-all ${
              callState !== 'connected' ? 'animate-pulse-ring' : ''
            }`}
            style={{ borderColor: statusColor }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#38BDF8] to-blue-600 flex items-center justify-center text-4xl font-extrabold text-white shadow-2xl">
              {initials}
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight mb-3 text-center">
            {displayName}
          </h2>

          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ backgroundColor: `${statusColor}20` }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-sm font-bold" style={{ color: statusColor }}>
              {getStatusText()}
            </span>
          </div>
        </div>
      )}

      {/* Call Controls Footer */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-center pb-4">
        {callState === 'connected' || callState === 'calling' ? (
          <div className="flex items-center justify-center gap-5 sm:gap-7 bg-[#1E293B]/90 border border-white/10 px-8 py-4 rounded-3xl shadow-2xl">
            <button
              onClick={toggleMute}
              className={`flex flex-col items-center gap-1.5 group`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-[#38BDF8] text-[#0F172A]'
                    : 'bg-[#0F172A] text-[#F8FAFC] hover:bg-[#334155]'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </div>
              <span className="text-xs font-semibold text-[#94A3B8]">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleCamera}
                className="flex flex-col items-center gap-1.5"
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isCameraOff
                      ? 'bg-[#38BDF8] text-[#0F172A]'
                      : 'bg-[#0F172A] text-[#F8FAFC] hover:bg-[#334155]'
                  }`}
                >
                  {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </div>
                <span className="text-xs font-semibold text-[#94A3B8]">
                  {isCameraOff ? 'Cam Off' : 'Camera'}
                </span>
              </button>
            )}

            <button
              onClick={endCall}
              className="flex flex-col items-center gap-1.5"
              title="End Call"
            >
              <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform active:scale-95">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold text-red-400">End</span>
            </button>

            <button
              onClick={toggleSpeaker}
              className="flex flex-col items-center gap-1.5"
              title={isSpeaker ? 'Mute Speaker' : 'Enable Speaker'}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isSpeaker
                    ? 'bg-[#38BDF8] text-[#0F172A]'
                    : 'bg-[#0F172A] text-[#F8FAFC] hover:bg-[#334155]'
                }`}
              >
                {isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </div>
              <span className="text-xs font-semibold text-[#94A3B8]">Speaker</span>
            </button>
          </div>
        ) : callState === 'ringing' ? (
          <div className="flex items-center justify-center gap-12">
            <button onClick={rejectCall} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-500/30 transition-transform group-hover:scale-105">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-sm font-bold text-[#F8FAFC]">Decline</span>
            </button>

            <button onClick={acceptCall} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-transform group-hover:scale-105 animate-bounce">
                {callType === 'video' ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
              </div>
              <span className="text-sm font-bold text-[#F8FAFC]">Accept</span>
            </button>
          </div>
        ) : (
          <p className="text-[#94A3B8] text-base font-medium">Call has ended</p>
        )}
      </div>
    </div>
  );
};
