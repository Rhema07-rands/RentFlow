import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, ExternalLink, ShieldCheck, Truck, Sparkle, Globe } from 'lucide-react';
import { GOOGLE_ADSENSE_CLIENT_ID, GOOGLE_ADSENSE_SLOT_ID } from '../config/api';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdBannerProps {
  placement?: 'feed' | 'sidebar' | 'detail_footer' | 'search';
  format?: 'hybrid' | 'native' | 'adsense';
  onUpgradeClick?: () => void;
}

const SPONSORS = [
  {
    tag: 'Moving & Logistics',
    title: 'SwiftMove Logistics — Move to Your New Home Stress-Free',
    desc: 'Professional movers, secure packing, and insured interstate & local haulage. Get 15% off your move today.',
    cta: 'Get Free Quote',
    icon: Truck,
    badgeColor: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20',
    link: 'https://swiftmove.ng',
  },
  {
    tag: 'Home & Tenant Insurance',
    title: 'PrimeCover Renters Protection — Peace of Mind from ₦3,500/mo',
    desc: 'Instant coverage for tenant liability, electronics, generator damage, and water leakage.',
    cta: 'Explore Plans',
    icon: ShieldCheck,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    link: 'https://primecover.ng',
  },
  {
    tag: 'Deep Cleaning & Fumigation',
    title: 'CleanPro Living — Move into a Spotless, Sanitized Home',
    desc: 'Post-construction and move-in deep cleaning with non-toxic fumigation certified for families.',
    cta: 'Book Cleaner',
    icon: Sparkle,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    link: 'https://cleanpro.ng',
  },
];

export const AdBanner: React.FC<AdBannerProps> = ({
  placement = 'feed',
  format = 'hybrid',
  onUpgradeClick,
}) => {
  const { user } = useAuth();
  const [sponsorIndex] = useState(() => Math.floor(Math.random() * SPONSORS.length));
  const [adsenseLoaded, setAdsenseLoaded] = useState(false);
  const adsenseRef = useRef<HTMLModElement | null>(null);

  // If user is a verified Pro subscriber, hide all ads completely!
  if (user?.isPremium) {
    return null;
  }

  // Check if a real AdSense client ID has been configured
  const hasRealAdSense =
    Boolean(GOOGLE_ADSENSE_CLIENT_ID) &&
    !GOOGLE_ADSENSE_CLIENT_ID.includes('0000000000000000') &&
    GOOGLE_ADSENSE_CLIENT_ID.startsWith('ca-pub-');

  const shouldRenderAdSense = (format === 'adsense' || (format === 'hybrid' && hasRealAdSense));

  useEffect(() => {
    if (shouldRenderAdSense) {
      try {
        if (typeof window !== 'undefined' && adsenseRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdsenseLoaded(true);
        }
      } catch (err) {
        console.warn('AdSense ad load skipped/blocked:', err);
      }
    }
  }, [shouldRenderAdSense]);

  const sponsor = SPONSORS[sponsorIndex];
  const Icon = sponsor.icon;

  return (
    <div className="relative rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] border border-[#38BDF8]/25 p-5 sm:p-6 shadow-2xl my-6 overflow-hidden group transition-all hover:border-[#38BDF8]/50">
      {/* Background glow decoration */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header bar inside Ad */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold tracking-widest text-[#94A3B8] uppercase bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5 flex items-center gap-1">
            <Globe className="w-2.5 h-2.5 text-[#38BDF8]" />
            {hasRealAdSense ? 'Google Ads & Partner' : 'Sponsored Partner'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sponsor.badgeColor}`}>
            {sponsor.tag}
          </span>
        </div>

        {/* Remove Ads Upgrade Button */}
        {onUpgradeClick && (
          <button
            type="button"
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-[#38BDF8] bg-[#38BDF8]/10 hover:bg-[#38BDF8] hover:text-[#0F172A] border border-[#38BDF8]/30 transition-all shadow-sm"
            title="Upgrade to RentFlow Pro to remove all ads"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Remove Ads</span>
          </button>
        )}
      </div>

      {/* Google AdSense container if enabled */}
      {shouldRenderAdSense ? (
        <div className="w-full my-2 min-h-[90px] flex items-center justify-center bg-[#0F172A]/50 rounded-2xl border border-white/5 overflow-hidden">
          <ins
            ref={adsenseRef}
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '90px' }}
            data-ad-client={GOOGLE_ADSENSE_CLIENT_ID}
            data-ad-slot={GOOGLE_ADSENSE_SLOT_ID}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        /* Native High-CPM Real Estate Sponsor */
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#0F172A] border border-white/10 flex items-center justify-center text-[#38BDF8] shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <Icon className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <h4 className="text-base font-extrabold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors line-clamp-1">
                {sponsor.title}
              </h4>
              <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-2">
                {sponsor.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
            <a
              href={sponsor.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#F8FAFC] font-bold text-xs transition-all border border-white/5"
            >
              <span>{sponsor.cta}</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8]" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
