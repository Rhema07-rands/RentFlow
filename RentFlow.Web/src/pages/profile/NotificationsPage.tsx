import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [messagesEnabled, setMessagesEnabled] = useState(true);
  const [updatesEnabled, setUpdatesEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const renderToggle = (
    title: string,
    desc: string,
    value: boolean,
    onChange: (val: boolean) => void
  ) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="pr-4">
        <h4 className="text-base font-bold text-[#F8FAFC]">{title}</h4>
        <p className="text-xs text-[#94A3B8] mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
          value ? 'bg-[#38BDF8]' : 'bg-[#334155]'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-2xl w-full mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Notifications</h1>
      </div>

      <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 space-y-6">
        <div>
          <h3 className="text-xs font-extrabold text-[#475569] tracking-widest uppercase mb-2">
            GLOBAL ALERTS
          </h3>
          {renderToggle(
            'Browser Push Notifications',
            'Receive desktop alerts when new messages or calls arrive',
            pushEnabled,
            setPushEnabled
          )}
          {renderToggle(
            'Email Notifications',
            'Receive daily email summaries of property inquiries',
            emailEnabled,
            setEmailEnabled
          )}
        </div>

        <div>
          <h3 className="text-xs font-extrabold text-[#475569] tracking-widest uppercase mb-2">
            SPECIFIC ALERTS
          </h3>
          {renderToggle(
            'New Messages',
            'Get notified immediately when someone messages you',
            messagesEnabled,
            setMessagesEnabled
          )}
          {renderToggle(
            'Property Updates',
            'Status changes and new reviews on your listings',
            updatesEnabled,
            setUpdatesEnabled
          )}
          {renderToggle(
            'Marketing & Offers',
            'Promotions and featured listing opportunities',
            marketingEnabled,
            setMarketingEnabled
          )}
        </div>
      </div>
    </div>
  );
};
