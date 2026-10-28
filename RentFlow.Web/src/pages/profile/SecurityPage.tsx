import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomAlert } from '../../contexts/AlertContext';

export const SecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showAlert } = useCustomAlert();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      showAlert('Error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showAlert('Error', 'New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      if (response.ok) {
        showAlert('Success', 'Password changed successfully!', () => {
          navigate(-1);
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        const text = await response.text();
        showAlert('Error', text || 'Failed to change password');
      }
    } catch {
      showAlert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-2xl w-full mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Security</h1>
          <p className="text-xs text-[#94A3B8]">
            Update your password to keep your RentFlow account secure
          </p>
        </div>
      </div>

      <form
        onSubmit={handleChangePassword}
        className="bg-[#1E293B] border border-white/5 rounded-3xl p-8 space-y-6"
      >
        {[
          {
            label: 'Current Password',
            value: currentPassword,
            setValue: setCurrentPassword,
            show: showCurrent,
            setShow: setShowCurrent,
          },
          {
            label: 'New Password',
            value: newPassword,
            setValue: setNewPassword,
            show: showNew,
            setShow: setShowNew,
          },
          {
            label: 'Confirm New Password',
            value: confirmNewPassword,
            setValue: setConfirmNewPassword,
            show: showConfirm,
            setShow: setShowConfirm,
          },
        ].map((field) => (
          <div key={field.label}>
            <label className="block text-sm font-bold text-[#F8FAFC] mb-2">{field.label}</label>
            <div className="flex items-center bg-[#0F172A] border border-white/10 focus-within:border-[#38BDF8] rounded-xl px-4 h-13">
              <Lock className="w-5 h-5 text-[#94A3B8] mr-3 shrink-0" />
              <input
                type={field.show ? 'text' : 'password'}
                value={field.value}
                onChange={(e) => field.setValue(e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="flex-1 bg-transparent text-[#F8FAFC] placeholder-[#64748B] py-3.5 focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => field.setShow(!field.show)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] ml-2"
              >
                {field.show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={isLoading || !currentPassword || !newPassword || !confirmNewPassword}
          className="w-full py-4 rounded-2xl bg-[#38BDF8] text-[#0F172A] font-extrabold text-base disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Change Password'}
        </button>
      </form>
    </div>
  );
};
