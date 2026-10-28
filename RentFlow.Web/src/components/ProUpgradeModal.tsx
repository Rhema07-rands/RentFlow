import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, Zap, Award, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../contexts/AlertContext';
import { API_BASE, PAYSTACK_PUBLIC_KEY } from '../config/api';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ isOpen, onClose }) => {
  const { user, token, updateUserState } = useAuth();
  const { showAlert } = useCustomAlert();

  const [selectedPlan, setSelectedPlan] = useState<'ProMonthly' | 'ProAnnual'>('ProMonthly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const planPrices = {
    ProMonthly: { amount: 2500, label: '₦2,500', period: '/ month', kobo: 250000 },
    ProAnnual: { amount: 21000, label: '₦21,000', period: '/ year (₦1,750/mo)', kobo: 2100000 },
  };

  const loadPaystackScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      const verifyRes = await fetch(`${API_BASE}/api/subscription/verify-paystack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reference: reference,
          plan: selectedPlan,
        }),
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        updateUserState({
          isPremium: true,
          subscriptionPlan: data.subscriptionPlan || selectedPlan,
          subscriptionExpiresAt: data.subscriptionExpiresAt,
        });
        showAlert('Welcome to RentFlow Pro! 👑', 'All ads have been permanently removed.');
        onClose();
      } else {
        const err = await verifyRes.text();
        showAlert('Verification Warning', err || 'Could not verify payment reference.');
      }
    } catch (e: any) {
      showAlert('Verification Error', e.message || 'Payment verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!token || !user) {
      showAlert('Sign In Required', 'Please sign in or create an account to activate RentFlow Pro.');
      return;
    }

    setIsProcessing(true);

    try {
      const scriptLoaded = await loadPaystackScript();
      if (!scriptLoaded || !window.PaystackPop) {
        throw new Error('Failed to load Paystack payment modal.');
      }

      const activePlan = planPrices[selectedPlan];
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email || 'user@rentflow.ng',
        amount: activePlan.kobo,
        currency: 'NGN',
        ref: `RF_PRO_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        metadata: {
          custom_fields: [
            { display_name: 'Customer Name', variable_name: 'customer_name', value: user.name },
            { display_name: 'Plan', variable_name: 'subscription_plan', value: selectedPlan },
          ],
        },
        callback: function (response: { reference: string }) {
          handlePaymentSuccess(response.reference);
        },
        onClose: function () {
          setIsProcessing(false);
        },
      });

      handler.openIframe();
    } catch (err: any) {
      setIsProcessing(false);
      showAlert('Payment Error', err.message || 'Could not initiate Paystack checkout.');
    }
  };

  const handleDemoToggle = async () => {
    if (!token) {
      showAlert('Sign In Required', 'Please sign in to test the demo upgrade.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/subscription/toggle-demo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        updateUserState({
          isPremium: data.isPremium,
          subscriptionPlan: data.subscriptionPlan,
          subscriptionExpiresAt: data.subscriptionExpiresAt,
        });
        showAlert(
          data.isPremium ? 'Pro Activated! 👑' : 'Reverted to Free Tier',
          data.Message || 'Status updated.'
        );
        onClose();
      }
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to toggle demo status.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0F172A] border border-[#38BDF8]/30 shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Glow behind */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#F8FAFC]">RentFlow Pro</h2>
            <p className="text-xs text-[#94A3B8]">Ad-Free Experience + Premium Landlord Tools</p>
          </div>
        </div>

        {/* Plan Selectors */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <button
            type="button"
            onClick={() => setSelectedPlan('ProMonthly')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedPlan === 'ProMonthly'
                ? 'bg-[#1E293B] border-[#38BDF8] ring-2 ring-[#38BDF8]/20'
                : 'bg-[#1E293B]/40 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="text-xs font-bold text-[#94A3B8] block">Monthly</span>
            <div className="text-xl font-extrabold text-[#F8FAFC] mt-1">₦2,500</div>
            <span className="text-[11px] text-[#64748B]">Billed monthly</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan('ProAnnual')}
            className={`p-4 rounded-2xl border text-left transition-all relative ${
              selectedPlan === 'ProAnnual'
                ? 'bg-[#1E293B] border-[#38BDF8] ring-2 ring-[#38BDF8]/20'
                : 'bg-[#1E293B]/40 border-white/5 hover:border-white/20'
            }`}
          >
            <span className="absolute -top-2.5 right-3 bg-emerald-500 text-[#0F172A] font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">
              SAVE 30%
            </span>
            <span className="text-xs font-bold text-[#94A3B8] block">Annual</span>
            <div className="text-xl font-extrabold text-[#F8FAFC] mt-1">₦21,000</div>
            <span className="text-[11px] text-emerald-400">₦1,750 / month</span>
          </button>
        </div>

        {/* Feature List */}
        <div className="space-y-3 mb-6 bg-[#1E293B]/50 border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#F8FAFC]">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span><strong>100% Ad-Free</strong> — all sponsored cards & banners removed</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#F8FAFC]">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span><strong>RentFlow Pro Badge</strong> displayed beside your name</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#F8FAFC]">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span><strong>Priority Direct Calling</strong> to verified landlords</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#F8FAFC]">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span><strong>Unlimited Video Tour Uploads</strong> for property listings</span>
          </div>
        </div>

        {/* Paystack Checkout Button */}
        <button
          onClick={handlePaystackPayment}
          disabled={isProcessing}
          className="w-full py-4 rounded-2xl bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#0F172A] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#38BDF8]/20 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Pay {planPrices[selectedPlan].label} via Paystack</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-[#64748B] text-center mt-3">
          Secured by Paystack • Cancel anytime • Instant activation
        </p>

        {/* Demo instant test button */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-[#94A3B8]">Want to test without a card?</span>
          <button
            type="button"
            onClick={handleDemoToggle}
            className="text-[11px] font-bold text-[#38BDF8] hover:underline"
          >
            {user?.isPremium ? 'Disable Pro (Show Ads)' : 'Instant Demo Pro Upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
};
