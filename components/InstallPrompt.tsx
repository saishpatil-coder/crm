'use client';

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsAndroid(ua.includes('android'));

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setShowInstall(false);
    }

    setDeferredPrompt(null);
  };

  // Already installed check
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone || !showInstall || !isAndroid) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white shadow-xl border rounded-2xl p-4 flex items-center justify-between z-50">
      <div>
        <p className="font-semibold">Install Campaign CRM</p>
        <p className="text-sm text-gray-500">For best offline experience</p>
      </div>

      <button
        onClick={handleInstall}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold"
      >
        Install
      </button>
    </div>
  );
}
