# Kiosk POS Android app (Capacitor)

Native Android shell: full-screen **WebView** (no Chrome address bar). The web app loads from your deployed URL or local dev server.

## Chrome vs native APK — read this first

| What you see | What it is |
|--------------|------------|
| Chrome address bar, tabs, “Powered by Chrome” | **Browser** or **PWA installed from Chrome** — not the native app |
| Full screen, splash, bottom nav (POS / Home / Stock / More) | **Capacitor APK** — correct |

**Open the app from the app drawer:** icon labeled **Kiosk POS** (`shop.kioskpos.app`).  
Do **not** use Chrome → “Install app” or a bookmark to `kioskpos.shop` for shop-floor use.

## Architecture

```
Android APK (Capacitor BridgeActivity)
  └── WebView → https://kioskpos.shop
              or http://10.0.2.2:3000 (emulator + npm run dev)
```

## Prerequisites

- Node.js 20+
- [Android Studio](https://developer.android.com/studio) (SDK 34+)
- **Java 21** (Capacitor 7; Gradle can auto-download it, or `brew install openjdk@21`)

## Install and run (device / emulator)

Scripts differ by folder. Use **one** of the blocks below.

### From `mobile/` (recommended if you are already there)

```bash
cd /path/to/kiosk_pos_web/mobile
npm install

npm run config:prod
npm run sync
npm run install:debug
```

One-liner for production:

```bash
npm run run:prod
```

### From repo root (`kiosk_pos_web/`)

```bash
cd /path/to/kiosk_pos_web
npm install
npm run mobile:install

npm run mobile:config:prod
npm run mobile:sync
npm run mobile:install:debug
```

Or open in Android Studio from root: `npm run mobile:android` → Run ▶.

### Local dev (Next.js + emulator)

```bash
# Terminal 1 — repo root
npm run dev

# Terminal 2 — mobile folder
cd mobile
npm run run:local
```

From repo root: `npm run mobile:run:local`

Physical device on Wi‑Fi:

```bash
cd mobile
CAPACITOR_SERVER_URL=http://YOUR_LAN_IP:3000 npm run config:local
npm run sync:android
cd android && ./gradlew installDebug
```

## Supabase (required for Google sign-in in the APK)

Add to **Authentication → URL configuration → Redirect URLs**:

- `kioskpos://auth/callback`
- `kioskpos://**`
- `https://kioskpos.shop/**` (existing)

Google OAuth in the native app uses `kioskpos://auth/callback` so the flow returns to the WebView instead of staying in Chrome.

## Verified App Links

`public/.well-known/assetlinks.json` links `https://kioskpos.shop` to package `shop.kioskpos.app`.  
Deploy to production so https links open in the app when installed.

**Release builds:** add your Play App Signing SHA-256 fingerprint to `assetlinks.json` (debug fingerprint is already included for local builds).

## Native UX (phase B+)

- Bottom navigation (POS, Home, Stock, More)
- Compact header with page title
- Splash screen (hidden after load)
- Android back → history or minimize
- In-app navigation allowlist (Google OAuth, Supabase, Yo checkout stay in WebView)
- `KioskPOS-Native/1.0` user-agent on WebView requests

## Project paths

| Path | Purpose |
|------|---------|
| `mobile/android/` | Android Studio / Gradle project |
| `mobile/capacitor.config.ts` | WebView URL & plugins (generated) |
| `mobile/scripts/write-capacitor-config.mjs` | `production` / `local` config |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Opens in **Chrome** with URL bar | You are not in the APK — run `npm run mobile:install:debug` and launch **Kiosk POS** from the app drawer |
| `Unable to launch Android Studio` | Install Studio, or open `mobile/android` manually in Studio |
| White screen | Check internet; verify `https://kioskpos.shop` loads in device browser |
| Emulator local dev blank | Use `10.0.2.2`, not `localhost`; run `npm run mobile:config:local` then `sync` |
| Google sign-in leaves Chrome | Add `kioskpos://auth/callback` to Supabase redirect URLs; redeploy web app |
| No bottom nav | Deploy latest web to production (bottom nav is in the **web app**, not the APK alone), or use `npm run mobile:run:local` with `npm run dev` |
| No bottom nav (deployed) | Force-close app and reopen; ensure you are on `/dashboard` or `/pos` (not `/login`). Bottom nav needs native detection (`KioskPOS-Native` user-agent). |
| `invalid source release: 21` | Install JDK 21: `brew install openjdk@21` then `export JAVA_HOME="$(/usr/libexec/java_home -v 21)"` and re-run `npm run install:debug` |

## Phase C (next)

- Play Store signing & closed testing
- Bluetooth receipt printer plugin
- Push notifications for sync failures
