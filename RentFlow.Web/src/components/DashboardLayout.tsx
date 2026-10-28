import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  PlusCircle,
  MessageSquare,
  Heart,
  PhoneCall,
  Settings,
  LogOut,
  Home,
  User as UserIcon,
  LogIn
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { getInitials } from '../config/api';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { conversations, isConnected } = useChat();
  const navigate = useNavigate();

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const navItems = [
    { to: '/dashboard/explore', icon: Compass, label: 'Explore' },
    { to: '/dashboard/search', icon: Search, label: 'Search & Filter' },
    { to: '/dashboard/add', icon: PlusCircle, label: 'List Property' },
    { to: '/dashboard/chats', icon: MessageSquare, label: 'Messages', badge: totalUnread },
    { to: '/dashboard/saved', icon: Heart, label: 'Saved Homes' },
    { to: '/dashboard/call-history', icon: PhoneCall, label: 'Call Logs' },
    { to: '/dashboard/settings', icon: Settings, label: 'Account Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col md:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-[#1E293B]/70 backdrop-blur-xl border-r border-white/5 shrink-0 sticky top-0 h-screen">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/dashboard/explore')}
          className="flex items-center gap-3.5 px-6 py-6 border-b border-white/5 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#38BDF8] flex items-center justify-center shadow-lg shadow-[#38BDF8]/30 group-hover:scale-105 transition-transform">
            <Home className="w-6 h-6 text-[#0F172A]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#F8FAFC]">RentFlow</h1>
            <p className="text-xs text-[#94A3B8] font-medium">Property & Chat Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#38BDF8] text-[#0F172A] shadow-lg shadow-[#38BDF8]/25'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-red-500 text-white">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5">
          {user ? (
            <div className="bg-[#0F172A]/80 border border-white/5 rounded-2xl p-3.5 flex items-center justify-between">
              <div
                onClick={() => navigate('/dashboard/profile/personal-info')}
                className="flex items-center gap-3 min-w-0 cursor-pointer"
              >
                {user.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#38BDF8]/40 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center font-bold text-sm shrink-0">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#F8FAFC] truncate">{user.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-[11px] text-[#94A3B8] truncate">
                      {isConnected ? 'Realtime Active' : 'Online'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#38BDF8]/20 hover:bg-[#38BDF8]/90 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 flex flex-col">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E293B]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 flex items-center justify-around">
        {[
          { to: '/dashboard/explore', icon: Compass, label: 'Explore' },
          { to: '/dashboard/search', icon: Search, label: 'Search' },
          { to: '/dashboard/add', icon: PlusCircle, label: 'Add' },
          { to: '/dashboard/chats', icon: MessageSquare, label: 'Chats', badge: totalUnread },
          { to: '/dashboard/settings', icon: UserIcon, label: 'Account' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive ? 'text-[#38BDF8]' : 'text-[#94A3B8]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="absolute top-1 right-2 w-4 h-4 text-[10px] font-bold rounded-full bg-red-500 text-white flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
