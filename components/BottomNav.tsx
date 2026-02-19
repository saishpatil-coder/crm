"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { user,isLoading } = useAuth();

  if (isLoading) {
    console.log("in bottome nav : loading")
    return <div>Loading...</div>; // Or your loading spinner
  }

  // If we finished loading and there IS no user, don't render the protected content
  // (The useEffect above will handle the redirect)
  if (!user) {
    console.log("routing from bottomnav")
    return null;
  }

  // 1. Define distinct menus for each role
  const menus = {
    MASTER_ADMIN: [
      { name: "Home", href: "/dashboard", icon: HomeIcon },
      { name: "Campaigns", href: "/admin/tenants", icon: CampaignsIcon },
      { name: "Activity", href: "/admin/activity", icon: ActivityIcon },
    ],
    SUB_ADMIN: [
      // This is the Candidate's Manager
      { name: "Overview", href: "/dashboard", icon: HomeIcon },
      { name: "Workers", href: "/tenant/workers", icon: UsersIcon },
      { name: "Booths", href: "/tenant/booths", icon: BoothsIcon },
    ],
    WORKER: [
      { name: "My Tasks", href: "/dashboard", icon: HomeIcon },
      { name: "Voters", href: "/worker/voters", icon: UsersIcon },
      { name: "Map", href: "/worker/map", icon: MapIcon },
    ],
  };

  // 2. Select the right menu (fallback to WORKER if role is weird)
  const navItems = menus[user.role as keyof typeof menus] || menus.WORKER;

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50 pb-safe md:max-w-md md:mx-auto md:left-0 md:right-0">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          // Check if current route matches the tab's href
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <item.icon
                className={`w-6 h-6 ${isActive ? "stroke-current stroke-[2.5]" : "stroke-current stroke-[1.5]"}`}
              />
              <span
                className={`text-[10px] uppercase tracking-wider ${isActive ? "font-black" : "font-bold"}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

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
} // Reuse icon for now
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
function MapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
