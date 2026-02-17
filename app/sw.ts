import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "@serwist/sw";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // This automatically caches all the Next.js build files (JS/CSS)
  precacheEntries: self.__SW_MANIFEST,
  // If a file isn't precached, fall back to these default caching strategies
  runtimeCaching: defaultCache,
  // Safely skip waiting to activate the new worker immediately
  skipWaiting: true,
  clientsClaim: true,
});

serwist.addEventListeners();
