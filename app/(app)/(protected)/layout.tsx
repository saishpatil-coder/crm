import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 flex flex-col">
      {" "}
      {/* Main scrollable content area. 
        pb-20 ensures the content doesn't get hidden behind the 16px (4rem) Bottom Nav 
      */}
      {/* <Header /> */}
      <main className="flex-1">{children}</main>
      {/* The Sticky Navigation */}
      <BottomNav />
    </div>
  );
}
