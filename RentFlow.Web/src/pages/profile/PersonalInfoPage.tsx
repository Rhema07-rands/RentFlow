import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomAlert } from '../../contexts/AlertContext';

export const PersonalInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user, updateUserState } = useAuth();
  const { showAlert } = useCustomAlert();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  const [originalFirstName, setOriginalFirstName] = useState('');
  const [originalLastName, setOriginalLastName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        if (user) {
          const parts = (user.name || '').split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
          setEmail(user.email || '');
        }
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const nameParts = (data.name || '').split(' ');
          const fName = nameParts[0] || '';
          const lName = nameParts.slice(1).join(' ') || '';

          setFirstName(fName);
          setLastName(lName);
          setEmail(data.email || '');
          setPhone(data.phoneNumber || '');
          setProfilePictureUrl(data.profilePictureUrl || null);

          setOriginalFirstName(fName);
          setOriginalLastName(lName);
          setOriginalEmail(data.email || '');
          setOriginalPhone(data.phoneNumber || '');
        }
      } catch {
        showAlert('Error', 'Could not connect to server.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setLocalPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) {
      showAlert('Validation', 'First Name and Email are required.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      formData.append('Name', fullName);
      formData.append('Email', email.trim());
      formData.append('PhoneNumber', phone.trim());

      if (selectedFile) {
        formData.append('ProfilePicture', selectedFile);
      }

      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfilePictureUrl(data.profilePictureUrl);
        setSelectedFile(null);
        setLocalPreview(null);

        setOriginalFirstName(firstName);
        setOriginalLastName(lastName);
        setOriginalEmail(email);
        setOriginalPhone(phone);

        updateUserState({
          name: fullName,
          email: email.trim(),
          profilePictureUrl: data.profilePictureUrl,
        });

        showAlert('Success', 'Profile updated successfully!');
      } else {
        const errorText = await res.text();
        showAlert('Error', errorText || 'Failed to update profile.');
      }
    } catch {
      showAlert('Error', 'Could not connect to server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-9 h-9 text-[#38BDF8] animate-spin" />
      </div>
    );
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  const displayImage = localPreview || profilePictureUrl;
  const hasChanges =
    firstName !== originalFirstName ||
    lastName !== originalLastName ||
    email !== originalEmail ||
    phone !== originalPhone ||
    selectedFile !== null;

  return (
    <div className="p-6 lg:p-10 max-w-2xl w-full mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Personal Information</h1>
      </div>

      <form onSubmit={handleSave} className="bg-[#1E293B] border border-white/5 rounded-3xl p-8 space-y-6">
        {/* Avatar Picker */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative">
            {displayImage ? (
              <img
                src={displayImage}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-2 border-[#38BDF8]"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#0F172A] border-2 border-[#38BDF8]/40 flex items-center justify-center text-3xl font-extrabold text-[#38BDF8]">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#38BDF8] text-[#0F172A] flex items-center justify-center shadow-lg"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#94A3B8] mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@example.com"
            className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#94A3B8] mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 800 000 0000"
            className="w-full bg-[#0F172A] text-[#F8FAFC] px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#38BDF8]"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !hasChanges}
          className="w-full py-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-base disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};
