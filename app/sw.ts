import { defaultCacheOnFrontEnd, defaultCacheOnServer } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCacheOnFrontEnd,
    ...defaultCacheOnServer,
    // Add custom runtime caching rules for Supabase assets or images if needed
  ],
});

serwist.addEventListeners();
