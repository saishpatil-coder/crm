/// <reference lib="webworker" />

export {};

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: any;
  }
}

import { defaultCache } from "@serwist/next/worker";
import {
  installSerwist,
  handlePrecaching,
  registerRuntimeCaching,
} from "@serwist/sw";

// Install lifecycle
installSerwist({ skipWaiting: true, clientsClaim: true });

// Precache Next build files
handlePrecaching((self as any).__SW_MANIFEST);

// Runtime caching
defaultCache.forEach((cache) => registerRuntimeCaching(cache));
