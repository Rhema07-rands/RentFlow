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
      {/* Clean Solid Brand Mark (Zero Glow / Zero Slop) */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Crisp Container */}
          <rect width="64" height="64" rx="16" fill="#0F172A" />
          <rect
            x="1"
            y="1"
            width="62"
            height="62"
            rx="15"
            stroke="#38BDF8"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />

          {/* Peaked Architectural Chat Haven (The "Rent" Structure + "Chat" Bubble) */}
          <path
            d="M16 29L32 16L48 29V41C48 43.8 45.8 46 43 46H23L16 51V29Z"
            stroke="#38BDF8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Crisp Voice / Communication Pulse Bars */}
          <path
            d="M26 34V38"
            stroke="#38BDF8"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M32 29V42"
            stroke="#FFFFFF"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <path
            d="M38 34V38"
            stroke="#38BDF8"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Clean Logotype Text */}
      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center tracking-tight font-extrabold text-[#F8FAFC]">
            <span className={`${textSizes} text-[#F8FAFC]`}>Rent</span>
            <span className={`${textSizes} text-[#38BDF8]`}>Flow</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] ml-1 self-center" />
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
