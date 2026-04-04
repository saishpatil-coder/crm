// /// <reference lib="webworker" />
// import { defaultCache } from "@serwist/next/worker";
// import { installSerwist } from "@serwist/sw";

// export {};

// declare global {
//   interface ServiceWorkerGlobalScope {
//     __SW_MANIFEST: any;
//   }
// }

// declare const self: ServiceWorkerGlobalScope;

// // 1. FORCING THE CACHE: 
// // Add the exact URLs of your app here. The Service Worker will forcefully 
// // download the HTML for these pages in the background so they are ALWAYS available offline.
// const myForcedOfflinePages = [
//   { url: "/", revision: "v1" },
//   { url: "/mobile/voters", revision: "v1" } // Add any other main routes you use!
// ];

// // 2. Combine Vercel's manifest with our forced pages
// const combinedPrecache = [...(self.__SW_MANIFEST || []), ...myForcedOfflinePages];

// // 3. One single function call to wire everything together properly
// installSerwist({
//   precacheEntries: combinedPrecache,
//   skipWaiting: true,
//   clientsClaim: true,
//   navigationPreload: true,
//   runtimeCaching: defaultCache,
// });


/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "@serwist/sw";

export {};

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: any;
  }
}

declare const self: ServiceWorkerGlobalScope;

installSerwist({
  precacheEntries: self.__SW_MANIFEST, // Caches static assets automatically
  skipWaiting: true,
  clientsClaim: true,
  
  // 1. TURN ON THE MEMORY BANK
  // This automatically remembers every page, image, and API call the user visits!
  runtimeCaching: defaultCache, 
  
  // 2. THE SAFETY NET
  // If they click a link they haven't visited while offline, show our custom page
  fallbacks: {
    entries: [
      {
        url: "/~offline", // Points to the page we just created
        revision: "v1",
        matcher({ request }) {
          // If they are asking for an HTML page, give them the fallback
          return request.destination === "document";
        },
      },
    ],
  },
});