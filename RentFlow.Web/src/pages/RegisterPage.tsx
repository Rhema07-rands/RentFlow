import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Camera, Eye, EyeOff, Loader2, User, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../contexts/AlertContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showAlert } = useCustomAlert();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setProfileImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showAlert('Missing Fields', 'Name, email, and password are required.');
      return;
    }

    if (password.length < 8) {
      showAlert('Invalid Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Your passwords do not match.');
      return;
    }

    setIsLoading(true);
    const success = await register({
      name,
      email,
      password,
      phoneNumber: phone,
      gender: selectedGender,
      address,
      profilePictureBase64: profileImageBase64,
    });
    setIsLoading(false);

    if (success) {
      showAlert('Success', 'Registration successful! You can now log in.', () => {
        navigate('/login');
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex justify-center items-center py-12 px-6">
      <div className="w-full max-w-xl bg-[#1E293B] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-[#0F172A] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-extrabold text-[#F8FAFC]">Create Account</h1>
          <div className="w-11" />
        </div>

        {/* Profile Picture Picker */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 rounded-full bg-[#0F172A] border-2 border-[#38BDF8]/40 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#38BDF8] transition-all"
            >
              {profileImageBase64 ? (
                <img src={profileImageBase64} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-[#475569]" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#38BDF8] text-[#0F172A] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <Camera className="w-4 h-4" />
            </button>
            {profileImageBase64 && (
              <button
                type="button"
                onClick={() => setProfileImageBase64(null)}
                className="absolute top-0 right-0 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"
                title="Remove Photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-[#94A3B8] mt-2">Click to upload profile photo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={100}
                className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={15}
                className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGender(g)}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                      selectedGender === g
                        ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]'
                        : 'bg-[#0F172A] border-white/10 text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5">Address</label>
            <input
              type="text"
              placeholder="123 Main Street, Lekki, Lagos"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={150}
              className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] pl-4 pr-11 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#94A3B8] mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] pl-4 pr-11 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-base shadow-lg shadow-[#38BDF8]/25 hover:bg-[#38BDF8]/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-[#94A3B8] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#38BDF8] font-bold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};
