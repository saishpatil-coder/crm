"use client";

import { useColor, ThemeColor } from "@/context/ColorContext";

interface CurvedHeaderProps {
  title: string;
  subtitle?: string;
  size?:number;
}

export default function CurvedHeader({ title, subtitle, size}: CurvedHeaderProps) {
  const { primaryColor } = useColor(); // 'blue', 'green', 'orange', etc.

  // Safely map all Tailwind classes so they don't get purged in production
  const themeStyles: Record<ThemeColor, { gradient: string; glow: string }> = {
    blue: {
      gradient: "from-blue-600 via-blue-700 to-blue-900",
      glow: "bg-blue-400",
    },
    green: {
      gradient: "from-green-600 via-emerald-700 to-emerald-900",
      glow: "bg-emerald-400",
    },
    orange: {
      gradient: "from-orange-400 via-orange-500 to-orange-400",
      glow: "bg-orange-300",
    },
    purple: {
      gradient: "from-purple-600 via-purple-700 to-purple-900",
      glow: "bg-purple-400",
    },
    red: {
      gradient: "from-red-600 via-red-700 to-red-900",
      glow: "bg-red-400",
    },
  };

  // Fallback to blue if color is undefined
  const currentTheme =themeStyles[primaryColor] || themeStyles.orange;

  return (
    <div className="sticky top-0 w-full z-10">
      <div
        className={`relative w-full overflow-hidden rounded-b-[1.5rem] bg-gradient-to-br ${currentTheme.gradient} shadow-[0_10px_20px_-10px_rgba(0,0,0,0.15)]`}
      >
        {/* --- Background Decorative Glow Effects --- */}
        <div
          className={`absolute -top-10 -right-10 w-40 h-40 ${currentTheme.glow} rounded-full mix-blend-overlay filter blur-[40px] opacity-60`}
        />
        <div
          className={`absolute -bottom-10 -left-10 w-40 h-40 ${currentTheme.glow} rounded-full mix-blend-overlay filter blur-[40px] opacity-60`}
        />
        {/* Subtle grid pattern overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] mix-blend-overlay" />

        {/* --- Header Content --- */}
        <div className="relative  pt-4 pb-5 flex flex-col items-center justify-center text-center">
          <h1
            className={`${size ? `text-[${size}px]` : "text-3xl"} font-black text-white tracking-tight drop-shadow-md leading-tight`}
          >
            {title}
          </h1>

          {subtitle && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-px w-6 bg-white/30 rounded-full" />
              <p className="text-[10px] font-extrabold text-white/90 uppercase tracking-[0.2em] drop-shadow-sm">
                {subtitle}
              </p>
              <div className="h-px w-6 bg-white/30 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
