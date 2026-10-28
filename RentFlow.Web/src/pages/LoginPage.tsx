import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Home, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      navigate('/dashboard/explore');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-[#1E293B] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 rounded-full bg-[#0F172A] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#38BDF8] flex items-center justify-center">
              <Home className="w-5 h-5 text-[#0F172A]" />
            </div>
            <span className="font-extrabold text-lg">RentFlow</span>
          </div>
          <div className="w-11" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Welcome Back</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Sign in to access your properties and messages</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#94A3B8] mb-2">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#94A3B8] mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] pl-4 pr-12 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-base shadow-lg shadow-[#38BDF8]/25 hover:bg-[#38BDF8]/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-[#94A3B8] mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-[#38BDF8] font-bold hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};
