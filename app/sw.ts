/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import {
  installSerwist,
  handlePrecaching,
  registerRuntimeCaching,
} from "@serwist/sw";

export {};

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: any;
  }
}

declare const self: ServiceWorkerGlobalScope;

// 1. Install with Navigation Preload (This fixes the offline dinosaur screen!)
installSerwist({ 
  skipWaiting: true, 
  clientsClaim: true,
  navigationPreload: true 
});

// 2. Precache the core Next.js files that Vercel generated
const manifest = self.__SW_MANIFEST || [];
handlePrecaching(manifest);

// 3. Register the standard Next.js runtime caching (Caches your pages as you visit them)
defaultCache.forEach((cacheRule) => registerRuntimeCaching(cacheRule));