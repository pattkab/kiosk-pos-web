export const NATIVE_APP_READY_EVENT = "kioskpos:app-ready";

declare global {
  interface Window {
    __kioskposAppReady?: boolean;
  }
}

const APP_SHELL_PREFIXES = [
  "/dashboard",
  "/pos",
  "/inventory",
  "/reports",
  "/settings",
  "/team",
  "/customers",
  "/invoices",
  "/notifications",
  "/select-organization",
] as const;

export function isAppShellRoute(pathname: string) {
  return APP_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthRoute(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/")
  );
}

export function signalNativeAppReady() {
  if (typeof window === "undefined" || window.__kioskposAppReady) return;

  window.__kioskposAppReady = true;
  window.dispatchEvent(new CustomEvent(NATIVE_APP_READY_EVENT));
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function waitForDocumentComplete(timeoutMs = 15000) {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  if (document.readyState === "complete") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", finish);
      resolve();
    };

    const timer = window.setTimeout(finish, timeoutMs);
    window.addEventListener("load", finish, { once: true });
  });
}

export function waitForSelector(selector: string, timeoutMs = 8000) {
  if (typeof document === "undefined") {
    return Promise.resolve(false);
  }

  const existing = document.querySelector(selector);
  if (existing) {
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      resolve(Boolean(document.querySelector(selector)));
    }, timeoutMs);

    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) return;
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve(true);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

export function waitForImage(selector: string, timeoutMs = 8000) {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, timeoutMs);

    const inspect = () => {
      const image = document.querySelector<HTMLImageElement>(selector);
      if (!image) return false;
      if (image.complete && image.naturalWidth > 0) {
        window.clearTimeout(timeout);
        resolve();
        return true;
      }

      image.addEventListener(
        "load",
        () => {
          window.clearTimeout(timeout);
          resolve();
        },
        { once: true },
      );
      image.addEventListener(
        "error",
        () => {
          window.clearTimeout(timeout);
          resolve();
        },
        { once: true },
      );
      return true;
    };

    if (inspect()) return;

    const observer = new MutationObserver(() => {
      if (inspect()) {
        observer.disconnect();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

export async function waitForRouteReady(pathname: string) {
  await waitForDocumentComplete();
  await waitForNextPaint();

  if (pathname === "/") {
    await waitForSelector("#hero-heading");
    await waitForImage('img[src*="kiosk-pos-enterprise-hero"]');
    await waitForNextPaint();
    return;
  }

  if (isAuthRoute(pathname)) {
    await waitForSelector('[data-native-splash-anchor="auth"]');
    await waitForNextPaint();
    return;
  }

  if (isAppShellRoute(pathname)) {
    await waitForSelector('[data-native-splash-anchor="app-shell"]');
    await waitForNextPaint();
    return;
  }

  await wait(120);
  await waitForNextPaint();
}

export async function waitForInitialRouteStable(
  getPathname: () => string,
  stableMs = 180,
  maxWaitMs = 2500,
) {
  let pathname = getPathname();
  const startedAt = Date.now();

  while (Date.now() - startedAt < maxWaitMs) {
    await wait(stableMs);
    const nextPathname = getPathname();
    if (nextPathname === pathname) {
      return pathname;
    }
    pathname = nextPathname;
  }

  return getPathname();
}
