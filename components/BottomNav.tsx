"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColor, ThemeColor } from "@/context/ColorContext"; // <-- Import useColor
import { useState, useEffect } from "react";

// --- Multi-language Dictionary ---
const dict = {
  // ... (keep your existing dictionary exactly as is)
  en: {
    home: "Home",
    campaigns: "Campaigns",
    activity: "Activity",
    overview: "Overview",
    workers: "Workers",
    booths: "Booths",
    feed: "Feed",
    voters: "Voters",
    menu: "Menu",
    tasks: "Tasks",
    stats: "Stats",
  },
  mr: {
    home: "मुख्यपृष्ठ",
    campaigns: "मोहिमा",
    activity: "क्रियाकलाप",
    overview: "आढावा",
    workers: "कार्यकर्ते",
    booths: "मतदान केंद्रे",
    feed: "फीड",
    voters: "मतदार",
    menu: "मेनू",
    tasks: "कामे",
    stats: "आकडेवारी",
  },
  hi: {
    home: "होम",
    campaigns: "अभियान",
    activity: "गतिविधि",
    overview: "अवलोकन",
    workers: "कार्यकर्ता",
    booths: "बूथ",
    feed: "फ़ीड",
    voters: "मतदाता",
    menu: "मेनू",
    tasks: "कार्य",
    stats: "आंकड़े",
  },
};

export default function BottomNav() {
  const pathname = usePathname();
  const { user, isLoading, activeRole } = useAuth();
  const { lang } = useLanguage();
  const { primaryColor } = useColor(); // <-- Pull the active color
  const t = dict[lang as keyof typeof dict];

  const [isNavigatingTo, setIsNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    setIsNavigatingTo(null);
  }, [pathname]);

  if (isLoading || !user) {
    return null;
  }

  // --- Dynamic Color Maps ---
  // We map the active theme to specific Tailwind classes so they don't get purged
  const themeStyles: Record<
    ThemeColor,
    {
      text: string;
      bg: string;
      bgActive: string;
      border: string;
      shadow: string;
    }
  > = {
    blue: {
      text: "text-blue-600",
      bg: "bg-blue-600",
      bgActive: "bg-blue-700",
      border: "border-blue-600",
      shadow: "shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)]",
    },
    green: {
      text: "text-emerald-600",
      bg: "bg-emerald-600",
      bgActive: "bg-emerald-700",
      border: "border-emerald-600",
      shadow: "shadow-[0_8px_16px_-4px_rgba(5,150,105,0.4)]",
    },
    orange: {
      text: "text-orange-500",
      bg: "bg-orange-500",
      bgActive: "bg-orange-600",
      border: "border-orange-500",
      shadow: "shadow-[0_8px_16px_-4px_rgba(249,115,22,0.4)]",
    },
    purple: {
      text: "text-purple-600",
      bg: "bg-purple-600",
      bgActive: "bg-purple-700",
      border: "border-purple-600",
      shadow: "shadow-[0_8px_16px_-4px_rgba(147,51,234,0.4)]",
    },
    red: {
      text: "text-red-600",
      bg: "bg-red-600",
      bgActive: "bg-red-700",
      border: "border-red-600",
      shadow: "shadow-[0_8px_16px_-4px_rgba(220,38,38,0.4)]",
    },
  };

  const currentTheme = themeStyles[primaryColor] || themeStyles.blue;

  // Define menus with translation keys and a flag for the center prominent button
  const menus = {
    MASTER_ADMIN: [
      { name: t.home, href: "/admin", icon: HomeIcon, isCenter: false },
      {
        name: t.campaigns,
        href: "/admin/tenants",
        icon: CampaignsIcon,
        isCenter: true,
      },
      {
        name: t.activity,
        href: "/admin/activity",
        icon: ActivityIcon,
        isCenter: false,
      },
    ],
    SUB_ADMIN: [
      { name: t.overview, href: "/dashboard", icon: HomeIcon, isCenter: false },
      {
        name: t.workers,
        href: "/dashboard/workers",
        icon: UsersIcon,
        isCenter: true,
      },
      {
        name: t.booths,
        href: "/dashboard/booths",
        icon: BoothsIcon,
        isCenter: false,
      },
    ],
    WORKER: [
      { name: t.feed, href: "/mobile/feed", icon: HomeIcon, isCenter: false },
      {
        name: t.voters,
        href: "/mobile/all-voters",
        icon: UsersIcon,
        isCenter: false,
      },
      { name: t.menu, href: "/mobile/menu", icon: GridIcon, isCenter: true },
      {
        name: t.tasks,
        href: "/mobile/tasks",
        icon: ClipboardIcon,
        isCenter: false,
      },
      {
        name: t.stats,
        href: "/mobile/stats",
        icon: ChartIcon,
        isCenter: false,
      },
    ],
  };

  const navItems = menus[activeRole as keyof typeof menus] || menus.WORKER;

  return (
    <nav className="fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.08)] z-50 pb-safe md:max-w-md md:mx-auto md:left-0 md:right-0">
      <div className="flex justify-around items-end h-16 pb-1 relative">
        {navItems.map((item) => {
          const isCurrentlyActive = pathname === item.href;
          const isLoadingThisRoute = isNavigatingTo === item.href;
          const isActive = isCurrentlyActive || isLoadingThisRoute;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (pathname !== item.href) setIsNavigatingTo(item.href);
              }}
              className={`relative flex flex-col items-center justify-end w-full h-full transition-all ${
                isNavigatingTo && !isLoadingThisRoute
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              {item.isCenter ? (
                // --- FLOATING CENTER BUTTON ---
                <div className="absolute bottom-1 flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-14 h-14 rounded-full border-4 border-white transition-transform active:scale-95 ${
                      isActive ? currentTheme.bgActive : currentTheme.bg
                    } ${currentTheme.shadow}`}
                  >
                    {isLoadingThisRoute ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <item.icon className="w-7 h-7 text-white stroke-current stroke-[2]" />
                    )}
                  </div>
                  <span
                    className={`text-[9px] mt-1 uppercase tracking-widest ${
                      isActive
                        ? `font-black ${currentTheme.text}`
                        : "font-extrabold text-gray-500"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
              ) : (
                // --- STANDARD NAV BUTTONS ---
                <div className="flex flex-col items-center justify-end space-y-1 mb-1">
                  {isLoadingThisRoute ? (
                    <div
                      className={`w-6 h-6 border-2 ${currentTheme.border} border-t-transparent rounded-full animate-spin`}
                    ></div>
                  ) : (
                    <item.icon
                      className={`w-6 h-6 transition-colors ${
                        isActive
                          ? `${currentTheme.text} stroke-current stroke-[2.5]`
                          : "text-gray-400 stroke-current stroke-[1.5] group-hover:text-gray-600"
                      }`}
                    />
                  )}
                  <span
                    className={`text-[9px] uppercase tracking-widest transition-colors ${
                      isActive
                        ? `font-black ${currentTheme.text}`
                        : "font-bold text-gray-400"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ... keep all your existing SVG icon functions below ...

// --- Icons (Same standard SVG approach) ---
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zm-10 10a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M18 20V10M12 20V4M6 20v-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CampaignsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoothsIcon({ className }: { className?: string }) {
  return CampaignsIcon({ className });
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M13 10V3L4 14h7v7l9-11h-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
