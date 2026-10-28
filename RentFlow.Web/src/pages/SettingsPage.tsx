import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Bell,
  Home,
  Star,
  ChevronRight,
  LogOut,
  LogIn,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProUpgradeModal } from '../components/ProUpgradeModal';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const renderSettingItem = (
    Icon: any,
    title: string,
    subtitle: string,
    route: string
  ) => (
    <div
      onClick={() => navigate(route)}
      className="flex items-center bg-[#1E293B] border border-white/5 hover:border-[#38BDF8]/40 p-4 rounded-2xl mb-3 cursor-pointer transition-all group"
    >
      <div className="w-11 h-11 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center mr-4 shrink-0 group-hover:bg-[#38BDF8] group-hover:text-[#0F172A] transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-[#F8FAFC]">{title}</h4>
        <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#475569] group-hover:text-[#38BDF8] transition-colors" />
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-3xl w-full mx-auto">
      <div className="mb-8 pb-6 border-b border-white/5">
        <h1 className="text-3xl font-extrabold text-[#F8FAFC]">Account Settings</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Manage your personal profile, security credentials, properties, and reviews
        </p>
      </div>

      <div className="space-y-8">
        {/* Membership & Ads Section */}
        <section>
          <h3 className="text-xs font-extrabold text-[#475569] tracking-widest uppercase mb-4">
            MEMBERSHIP & ADS
          </h3>
          <div
            onClick={() => setShowUpgradeModal(true)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
              user?.isPremium
                ? 'bg-gradient-to-r from-amber-500/10 via-[#1E293B] to-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
                : 'bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-[#38BDF8]/30 hover:border-[#38BDF8]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  user?.isPremium
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                }`}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-[#F8FAFC]">
                    {user?.isPremium ? 'RentFlow Pro Member 👑' : 'Free Tier (Ads Active)'}
                  </h4>
                  {user?.isPremium && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Ad-Free
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {user?.isPremium
                    ? 'All advertisements removed. Pro perks and direct calling active.'
                    : 'Upgrade to RentFlow Pro to remove all sponsor banners & ads platform-wide.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className={`px-4 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                user?.isPremium
                  ? 'bg-white/10 text-[#F8FAFC] group-hover:bg-white/15'
                  : 'bg-[#38BDF8] text-[#0F172A] group-hover:bg-[#38BDF8]/90 shadow-md shadow-[#38BDF8]/20'
              }`}
            >
              {user?.isPremium ? 'Manage' : 'Remove Ads'}
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-extrabold text-[#475569] tracking-widest uppercase mb-4">
            ACCOUNT
          </h3>
          {renderSettingItem(
            User,
            'Personal Information',
            'Name, email, phone number, profile picture',
            '/dashboard/profile/personal-info'
          )}
          {renderSettingItem(
            ShieldCheck,
            'Security',
            'Change password and account protection',
            '/dashboard/profile/security'
          )}
          {renderSettingItem(
            Bell,
            'Notifications',
            'Push, chat, and email alert preferences',
            '/dashboard/profile/notifications'
          )}
        </section>

        <section>
          <h3 className="text-xs font-extrabold text-[#475569] tracking-widest uppercase mb-4">
            PROPERTY MANAGEMENT
          </h3>
          {renderSettingItem(
            Home,
            'My Listings',
            'Manage, pause, or edit your listed properties',
            '/dashboard/profile/my-listings'
          )}
          {renderSettingItem(
            Star,
            'My Reviews',
            'See reviews you have written for properties',
            '/dashboard/profile/my-reviews'
          )}
        </section>

        {user ? (
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-base flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-base flex items-center justify-center gap-2 hover:bg-[#38BDF8]/90 transition-all shadow-lg shadow-[#38BDF8]/20"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>

      <ProUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};
