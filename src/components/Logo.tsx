import React from "react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
  showText?: boolean;
}

export default function Logo({ className = "", variant = "dark", showText = true }: LogoProps) {
  // Variant "dark" is for light backgrounds (uses Navy text). "light" is for dark backgrounds (uses white/Teal).
  const primaryColor = variant === "dark" ? "text-brand-navy" : "text-white";
  const mutedTextColor = variant === "dark" ? "text-slate-500" : "text-slate-400";
  const lineDecorationColor = variant === "dark" ? "bg-slate-300" : "bg-brand-teal/30";

  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* High-Fidelity Uploaded Logo Monogram Vector */}
      <div className="relative flex-shrink-0 group">
        <svg
          viewBox="0 0 120 75"
          className="w-14 h-9 drop-shadow-sm transition-all duration-300 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="logoTealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#00A896" />
            </linearGradient>
            <linearGradient id="logoNavyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#011627" />
              <stop offset="100%" stopColor="#002d5a" />
            </linearGradient>
          </defs>

          {/* Circuit network lines on the left */}
          {/* Top Branch */}
          <path
            d="M 38 27 L 28 27 L 22 17 L 11 17"
            stroke="#00B1A0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11" cy="17" r="3" fill="#00B1A0" />

          {/* Middle Branch */}
          <path
            d="M 38 38 L 8 38"
            stroke="#00B1A0"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="38" r="3" fill="#00B1A0" />

          {/* Bottom Branch */}
          <path
            d="M 38 49 L 28 49 L 22 59 L 14 59"
            stroke="#00B1A0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="59" r="3" fill="#00B1A0" />

          {/* The letter 'D' segment on the left (solid dark-blue / dark-navy) */}
          <path
            d="M 38 12 L 56 12 C 67 12, 74 19, 74 38 C 74 57, 67 64, 56 64 L 38 64 Z"
            fill="url(#logoNavyGradient)"
          />

          {/* Circular Cut-out inside 'D' (solid white) */}
          <circle cx="56" cy="38" r="14" fill="white" />

          {/* < /> code symbol inside white cutout */}
          {/* Left bracket < */}
          <path
            d="M 52 32 L 47 38 L 52 44"
            stroke="#00A896"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* slash / */}
          <path
            d="M 55 44 L 58 32"
            stroke="#00A896"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Right bracket > */}
          <path
            d="M 61 32 L 66 38 L 61 44"
            stroke="#00A896"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* The letter 'C' segment on the right with a stunning gradient */}
          <path
            d="M 99 21 C 94 14, 85 11, 79 13 C 67 15, 62 26, 62 38 C 62 50, 67 61, 79 63 C 85 65, 94 62, 99 55 A 11 11 0 0 1 94 48 C 88 52, 82 52, 78 51 C 71 50, 68 45, 68 38 C 68 31, 71 26, 78 25 C 82 24, 88 24, 94 28 A 11 11 0 0 1 99 21 Z"
            fill="url(#logoTealGradient)"
          />
        </svg>

        {/* Pulse accent glow */}
        <span className="absolute -inset-1 rounded-xl bg-brand-teal/10 blur opacity-60 group-hover:opacity-100 transition duration-300 pointer-events-none -z-10"></span>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline leading-none">
            <span className={`font-sans font-extrabold text-xl tracking-tight ${primaryColor}`}>
              Developer
            </span>
            <span className="font-sans font-extrabold text-xl tracking-tight text-brand-teal ml-0.5">
              Connect
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-1 self-stretch">
            <div className={`h-[1px] w-2 ${lineDecorationColor}`} />
            <span className={`text-[7.5px] font-mono tracking-wider font-extrabold uppercase whitespace-nowrap leading-none ${mutedTextColor}`}>
              HIRE DEVELOPERS, BUILD THE FUTURE
            </span>
            <div className={`h-[1px] w-2 ${lineDecorationColor}`} />
          </div>
        </div>
      )}
    </div>
  );
}
