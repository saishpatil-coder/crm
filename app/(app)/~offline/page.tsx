// app/~offline/page.tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <span className="text-6xl mb-6">📡</span>
      <h1 className="text-2xl font-black text-gray-900 mb-2">
        You are Offline
      </h1>
      <p className="text-gray-500 font-bold mb-8">
        You haven't visited this specific page yet, so it isn't saved on your
        device.
      </p>

      {/* Give them a safe route back to the data they DO have offline */}
      <a
        href="/mobile/all-voters"
        className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold w-full active:bg-green-700"
      >
        Go to Saved Voters List
      </a>
    </div>
  );
}
