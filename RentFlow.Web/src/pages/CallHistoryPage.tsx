import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone, Video, ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import { getInitials } from '../config/api';

export const CallHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { callHistory, startCall, clearHistory } = useCall();

  return (
    <div className="p-6 lg:p-10 max-w-4xl w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Call History</h1>
            <p className="text-xs text-[#94A3B8]">Recent audio & video inspection calls</p>
          </div>
        </div>

        {callHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {callHistory.length === 0 ? (
        <div className="text-center py-24 bg-[#1E293B]/50 border border-white/5 rounded-3xl">
          <Phone className="w-12 h-12 text-[#334155] mx-auto mb-3" />
          <p className="text-base font-bold text-[#F8FAFC]">No recent calls</p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Audio and video calls with landlords and tenants will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-white/5 rounded-3xl divide-y divide-white/5 overflow-hidden">
          {callHistory.map((item) => {
            const isMissed = item.type === 'missed';
            const isOutgoing = item.type === 'outgoing';

            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                    {getInitials(item.name)}
                  </div>

                  <div className="min-w-0">
                    <h4
                      className={`text-base font-bold truncate ${
                        isMissed ? 'text-red-400' : 'text-[#F8FAFC]'
                      }`}
                    >
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mt-0.5">
                      {isOutgoing ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ArrowDownLeft
                          className={`w-3.5 h-3.5 ${
                            isMissed ? 'text-red-400' : 'text-[#38BDF8]'
                          }`}
                        />
                      )}
                      <span className="capitalize">{item.type}</span>
                      <span>•</span>
                      <span className="capitalize">{item.callType} Call</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startCall(item.contactId, item.name, 'audio')}
                    className="w-10 h-10 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0F172A] flex items-center justify-center transition-all"
                    title="Audio Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startCall(item.contactId, item.name, 'video')}
                    className="w-10 h-10 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0F172A] flex items-center justify-center transition-all"
                    title="Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
