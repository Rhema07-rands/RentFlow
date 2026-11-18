import React from 'react';

interface RentFlowLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  withText?: boolean;
  subtitle?: string;
  className?: string;
}

export const RentFlowLogo: React.FC<RentFlowLogoProps> = ({
  size = 'md',
  withText = false,
  subtitle = 'Property & Chat Portal',
  className = '',
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 36
      : size === 'md'
      ? 44
      : size === 'lg'
      ? 52
      : 64;

  const textSizes =
    typeof size === 'number'
      ? 'text-lg'
      : size === 'sm'
      ? 'text-lg'
      : size === 'md'
      ? 'text-xl'
      : size === 'lg'
      ? 'text-2xl'
      : 'text-3xl';

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Dynamic Brand Mark */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-1deg]"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {/* Subtle ambient backglow on hover */}
        <div className="absolute inset-0 rounded-2xl bg-[#38BDF8]/25 blur-md opacity-70 group-hover:opacity-100 group-hover:blur-lg transition-all duration-300" />

        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-md"
        >
          <defs>
            {/* Background container gradient */}
            <linearGradient id="rf-bg-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="50%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Cyan to Vivid Blue Flow Gradient */}
            <linearGradient id="rf-flow-primary" x1="12" y1="14" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            {/* Luminous Roofline Gradient */}
            <linearGradient id="rf-roof-grad" x1="14" y1="16" x2="50" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="45%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Glowing Accent */}
            <linearGradient id="rf-spark-grad" x1="28" y1="28" x2="36" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>

          {/* Squircle Badge Background */}
          <rect width="64" height="64" rx="18" fill="url(#rf-bg-grad)" />
          <rect
            x="1"
            y="1"
            width="62"
            height="62"
            rx="17"
            stroke="#38BDF8"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />

          {/* Architectural Gable Roofline (The "Rent" Structure) */}
          <path
            d="M15 30L32 16L49 30"
            stroke="url(#rf-roof-grad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* The Fluid Infinity Loop (The "Flow" Wave & Real-Time Connection) */}
          <path
            d="M21 37C21 31.4772 25.4772 27 31 27C36.5228 27 41 31.4772 41 37C41 42.5228 36.5228 47 31 47C25 47 21 43 21 37"
            stroke="url(#rf-flow-primary)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Horizontal Connection Beam / Dynamic Wave Extension */}
          <path
            d="M30 37H44C46.2 37 47.5 35 46.5 33.2"
            stroke="#7DD3FC"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Core Illuminated Focal Spark */}
          <circle cx="31" cy="37" r="3" fill="url(#rf-spark-grad)" />
        </svg>
      </div>

      {/* Optional Logotype Text */}
      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center tracking-tight font-extrabold text-[#F8FAFC]">
            <span className={`${textSizes} text-[#F8FAFC]`}>Rent</span>
            <span className={`${textSizes} text-[#38BDF8]`}>Flow</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] ml-1 self-center animate-pulse" />
          </div>
          {subtitle && (
            <p className="text-[11px] text-[#94A3B8] font-medium tracking-wide -mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
