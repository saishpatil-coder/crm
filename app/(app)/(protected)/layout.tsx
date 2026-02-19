import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden md:max-w-md md:mx-auto md:border-x md:border-gray-200 md:shadow-2xl">
      {/* Main scrollable content area. 
        pb-20 ensures the content doesn't get hidden behind the 16px (4rem) Bottom Nav 
      */}
      <Header />
      <main className="flex-1 overflow-y-auto pb-20 pt-16">{children}</main>

      {/* The Sticky Navigation */}
      <BottomNav />
    </div>
  );
}
