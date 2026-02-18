'use client';

import { useEffect, useState } from 'react';

export default function PwaGuard({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const check = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      setIsStandalone(standalone);
    };

    check();
  }, []);

  if (!isStandalone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Install App to Continue</h1>
        <p className="text-gray-600 mb-6">
          This Campaign CRM works only as an installed app.
        </p>
        <p className="text-sm text-gray-500">
          Tap the browser menu → Add to Home Screen
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
