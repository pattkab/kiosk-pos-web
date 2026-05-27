import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";

declare const self: typeof globalThis & {
  __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  precacheOptions: {
    navigateFallback: "/offline.html",
    navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
  },
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
