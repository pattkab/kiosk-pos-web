# Kiosk POS Android app (Capacitor)

Native Android shell: full-screen **WebView** (no Chrome address bar). The web app loads from your deployed URL or local dev server.

## Roadmap

| Phase | Status | Highlights |
|-------|--------|------------|
| **A** | ✓ | Tablet PWA, offline checkout, sync queue |
| **B** | ✓ | Capacitor shell, App Links, native OAuth |
| **B+** | ✓ | Bottom nav, compact header, splash |
| **C** | ✓ | Keep-awake POS, sync notifications, thermal receipts, device settings, release docs |
| **D** | ✓ (partial) | Bluetooth ESC/POS printing, release signing scaffold, resume sync |
| **iOS** | ✓ (initial) | Capacitor iOS shell, Universal Links scaffold — see [IOS_APP.md](./IOS_APP.md) |
| **E** | Next | Play / App Store closed testing, push notifications, in-app updates |

See [ANDROID_RELEASE.md](./ANDROID_RELEASE.md) for Play Store signing.

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

## Native UX

### Phase B+ (shell)

- Bottom navigation (POS, Home, Stock, More)
- Compact header with page title
- Splash screen with Kiosk POS branding (hidden after load, min 600ms fade-out; 12s fallback)
- Android back → history or minimize
- In-app navigation allowlist (Google OAuth, Supabase, Yo checkout stay in WebView)
- `KioskPOS-Native/1.0` user-agent on WebView requests

### Phase C (shop floor)

- **Keep screen on** at `/pos` (Settings → Device & app)
- **Local notifications** when offline sync fails or conflicts
- **Share receipt** — thermal-formatted text via Android share sheet
- **Device settings** — `/settings/device` (native app only)
- **In-app review** — Play Store / App Store rating prompt after milestones (5 checkouts or 3 session days); manual trigger in Device & app settings

## App store ratings

The native shell uses `@capacitor-community/in-app-review` for the platform rating sheet (Google Play In-App Review on Android, StoreKit on iOS). A styled pre-prompt appears when:

| Trigger | When |
|---------|------|
| Checkout milestone | After the 5th completed sale |
| Session milestone | After using the app on 3 different days |
| Manual | **Settings → Device & app → Rate this app** |

Users can dismiss, snooze (90-day cooldown), or opt out permanently. If the native sheet is unavailable, the app opens the store listing instead.

Update `lib/native/app-store.ts` with your **iOS App Store ID** once the app is published.

## Permissions

The native shell declares Android permissions used by the web app. Camera access is required for **barcode scanning** (POS and inventory).

| Permission | Used for |
|------------|----------|
| `CAMERA` | Scan EAN/UPC/Code128 barcodes with the device camera |
| `INTERNET` | Load the hosted web app |
| `WAKE_LOCK` | Keep screen on at POS |
| `POST_NOTIFICATIONS` | Sync failure alerts |
| `BLUETOOTH_*` | ESC/POS receipt printers |

**Web browser:** allow camera when prompted at POS or inventory → scan. The site must be served over HTTPS.

**Android APK:** grant Camera when prompted, or enable it under Settings → Apps → Kiosk POS → Permissions. You can also pre-enable from **Settings → Device & app → Barcode scanner**.

**Future iOS app:** when you run `npx cap add ios`, Capacitor merges `NSCameraUsageDescription` from `capacitor.config.ts` into `Info.plist`.

## App icon & splash assets

Launcher icons and splash screens are generated from `mobile/resources/app-icon.png`.

After updating the source artwork:

```bash
cd mobile
npm run assets:generate
npm run config:prod
npm run sync:android
```

This updates Android mipmaps, splash drawables, iOS AppIcon/Splash, and `public/icons/` for the PWA.

## Project paths

| Path | Purpose |
|------|---------|
| `mobile/android/` | Android Studio / Gradle project |
| `mobile/capacitor.config.ts` | WebView URL & plugins (generated) |
| `mobile/resources/app-icon.png` | Source artwork for icons & splash |
| `mobile/scripts/generate-app-assets.mjs` | Regenerate Android/iOS/PWA assets |
| `docs/ANDROID_RELEASE.md` | Play Store signing & release AAB |
| `docs/PLAY_STORE.md` | Closed testing & store listing |
| `docs/IOS_APP.md` | iOS Capacitor shell & Xcode |
| `docs/APP_STORE.md` | TestFlight & App Store |

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
| Bluetooth scan finds nothing | Pair printer in Android Settings → Bluetooth first; grant Nearby devices / Location if prompted |
| Barcode scanner black screen | Grant **Camera** permission; on Android use Settings → Device & app → Enable camera, then reopen POS → Scan |
| Camera works in browser but not APK | Reinstall debug APK after manifest changes (`npm run mobile:sync` then `mobile:install:debug`) |
| Play Store upload | See [PLAY_STORE.md](./PLAY_STORE.md) and [ANDROID_RELEASE.md](./ANDROID_RELEASE.md) |

### Phase D (shop floor hardware)

- **Bluetooth ESC/POS printer** — scan & connect in Settings → Device & app; auto-print on checkout
- **Resume sync** — offline queue retries when app returns to foreground
- **Release signing** — optional `keystore.properties` for signed AAB (see ANDROID_RELEASE.md)

## Phase E (next)

- Play Store closed testing track
- Firebase Cloud Messaging when app is backgrounded
- In-app update prompts via Play Core
