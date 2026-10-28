import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ShieldCheck, MessageSquare, Video, Sparkles, ArrowRight, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] relative overflow-hidden flex flex-col justify-between">
      {/* Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#38BDF8]/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#38BDF8] flex items-center justify-center shadow-lg shadow-[#38BDF8]/30">
            <Home className="w-6 h-6 text-[#0F172A]" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">RentFlow</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate('/dashboard/explore')}
              className="px-5 py-2.5 rounded-xl bg-[#38BDF8] text-[#0F172A] font-bold text-sm shadow-lg shadow-[#38BDF8]/25 hover:bg-[#38BDF8]/90 transition-all"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-xl text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20 font-bold text-sm hover:bg-[#38BDF8]/20 transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2.5 rounded-xl bg-[#38BDF8] text-[#0F172A] font-bold text-sm shadow-lg shadow-[#38BDF8]/25 hover:bg-[#38BDF8]/90 transition-all"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E293B] border border-white/10 text-[#38BDF8] text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NIGERIA&apos;S MODERN PROPERTY & REAL-TIME RENT PORTAL</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#F8FAFC] mb-6">
            Discover & Manage <span className="text-[#38BDF8]">Properties</span> Effortlessly.
          </h1>

          <p className="text-lg text-[#94A3B8] leading-relaxed mb-8 max-w-xl">
            Browse verified apartments, duplexes, and commercial spaces. Chat directly with landlords in real-time, send voice notes, share documents, and tour properties via live HD video or audio calls.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-base shadow-xl shadow-[#38BDF8]/30 hover:bg-[#38BDF8]/90 transition-all flex items-center gap-2"
            >
              <span>Create Account</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-[#38BDF8] font-extrabold text-base hover:bg-[#38BDF8]/20 transition-all"
            >
              Login
            </button>

            <button
              onClick={() => navigate('/dashboard/explore')}
              className="px-4 py-4 text-[#94A3B8] hover:text-[#F8FAFC] font-semibold text-sm underline underline-offset-4 transition-colors"
            >
              Skip for now (Explore Demo)
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="grid sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/10">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#1E293B] text-[#38BDF8]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F8FAFC]">Verified Listings</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">Direct owners & transparent annual pricing</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#1E293B] text-[#38BDF8]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F8FAFC]">Live Chat & Voice</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">WhatsApp-grade messaging, images & voice notes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#1E293B] text-[#38BDF8]">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F8FAFC]">Audio & Video Calls</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">Encrypted WebRTC calls for virtual inspections</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Showcase Card */}
        <div className="relative">
          <div className="bg-[#1E293B] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative h-80">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000"
                alt="Featured Property"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-[#0F172A]/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[#38BDF8] text-xs font-bold">
                Duplex • Featured
              </div>
              <div className="absolute bottom-4 right-4 bg-[#0F172A]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <span className="text-[#38BDF8] font-extrabold text-lg">₦8,000,000/yr</span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-[#F8FAFC]">Executive 4-Bed Detached Duplex</h3>
              <p className="text-sm text-[#94A3B8] mt-1">Ikeja GRA, Lagos • 4 Beds • 4 Baths • 3,200 Sqft</p>
              <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center font-bold text-sm">
                    LL
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F8FAFC]">Lagos Luxury Living</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Landlord
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard/property/3')}
                  className="px-4 py-2 rounded-xl bg-[#38BDF8] text-[#0F172A] font-bold text-xs hover:bg-[#38BDF8]/90 transition-colors"
                >
                  Inspect Property
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 border-t border-white/5 text-center sm:flex items-center justify-between text-xs text-[#64748B]">
        <p>© {new Date().getFullYear()} RentFlow Web Platform. All rights reserved.</p>
        <p>Powered by ASP.NET Core, SignalR & WebRTC</p>
      </footer>
    </div>
  );
};
