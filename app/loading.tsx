export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      {/* Subtle fade-in pulse effect */}
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-slate-200 h-10 w-10"></div>
        <div className="flex-1 space-y-6 py-1">
          <div className="h-2 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
