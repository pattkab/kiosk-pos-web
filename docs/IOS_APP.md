# Kiosk POS iOS app (Capacitor)

Native iOS shell: full-screen **WKWebView** (no Safari address bar). The web app loads from your deployed URL or a local dev server — same architecture as the Android app.

## Roadmap

| Phase | Status | Highlights |
|-------|--------|------------|
| **A** | ✓ | Tablet PWA, offline checkout, sync queue |
| **B** | ✓ | Capacitor shell, deep links, native OAuth |
| **B+** | ✓ | Bottom nav, compact header, splash |
| **C** | ✓ | Keep-awake POS, sync notifications, thermal receipts, device settings |
| **D** | ✓ (partial) | Bluetooth ESC/POS printing, resume sync |
| **iOS shell** | ✓ (initial) | Xcode project, Universal Links scaffold, camera + Bluetooth permissions |
| **E** | Next | TestFlight, App Store listing, push notifications |

See [APP_STORE.md](./APP_STORE.md) for App Store Connect steps.

## Safari vs native app — read this first

| What you see | What it is |
|--------------|------------|
| Safari address bar, tabs | **Browser** or **PWA from Safari** — not the native app |
| Full screen, splash, bottom nav (POS / Home / Stock / More) | **Capacitor iOS app** — correct |

Launch **Kiosk POS** from the Home Screen after installing from Xcode or TestFlight. Do not rely on a Safari bookmark to `kioskpos.shop` for shop-floor use.

## Architecture

```
iOS app (Capacitor BridgeViewController)
  └── WKWebView → https://kioskpos.shop
              or http://localhost:3000 (Simulator + npm run dev)
```

Bundle ID: `shop.kioskpos.app`  
Custom URL scheme: `kioskpos://` (OAuth return + shortcuts)

## Prerequisites

- macOS with **Xcode 15+** (full Xcode, not Command Line Tools only)
- Apple Developer account (for device testing and App Store)
- Node.js 20+
- CocoaPods (`sudo gem install cocoapods` or `brew install cocoapods`)

Point Xcode tools at the full app (required for `pod install` / builds):

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

If Xcode is on an external drive (e.g. `/Volumes/SSD1/Applications/Xcode.app`):

```bash
sudo xcode-select -s /Volumes/SSD1/Applications/Xcode.app/Contents/Developer
```

The `npm run pod:install` script auto-detects Xcode at that path and sets `DEVELOPER_DIR` for the current run if `xcode-select` still points at Command Line Tools. You can also export it yourself:

```bash
export DEVELOPER_DIR=/Volumes/SSD1/Applications/Xcode.app/Contents/Developer
```

## Install and run

### Production (loads https://kioskpos.shop)

From repo root:

```bash
npm run mobile:config:prod
npm run mobile:ios:sync
npm run mobile:ios
```

From `mobile/`:

```bash
npm run run:prod:ios
```

In Xcode: select a simulator or connected device → **Run** ▶.

### Local dev (Simulator + Next.js)

```bash
# Terminal 1 — repo root
npm run dev

# Terminal 2 — repo root
npm run mobile:run:local:ios
```

This uses `http://localhost:3000` (iOS Simulator can reach the Mac’s dev server).

Physical iPhone on Wi‑Fi:

```bash
cd mobile
CAPACITOR_SERVER_URL=http://YOUR_LAN_IP:3000 npm run config:local:ios
npm run sync:ios
npm run open:ios
```

> Android emulator uses `10.0.2.2`; iOS Simulator uses `localhost`. Use the correct config script for each platform.

## Supabase (Google sign-in)

Add to **Authentication → URL configuration → Redirect URLs**:

- `kioskpos://auth/callback`
- `kioskpos://**`
- `https://kioskpos.shop/**`

Google OAuth returns to `kioskpos://auth/callback` so the flow stays inside the app WebView.

## Universal Links

`public/.well-known/apple-app-site-association` links `https://kioskpos.shop` to `shop.kioskpos.app`.

**Before production:**

1. Replace `REPLACE_WITH_APPLE_TEAM_ID` in `apple-app-site-association` with your 10-character Apple Team ID.
2. Deploy the web app so `https://kioskpos.shop/.well-known/apple-app-site-association` is reachable.
3. In Xcode → **Signing & Capabilities**, enable **Associated Domains** with `applinks:kioskpos.shop` (already in `App.entitlements`).

## Permissions

Configured in `mobile/ios/App/App/Info.plist`:

| Usage description | Used for |
|-------------------|----------|
| Camera | Barcode scanning at POS and inventory |
| Bluetooth | ESC/POS receipt printers |
| Local network (via ATS exception) | `localhost` dev server in Simulator |

Pre-enable camera from **Settings → Device & app → Barcode scanner** inside the app.

## Native UX (shared with Android)

- Bottom navigation (POS, Home, Stock, More)
- Compact header, splash screen, `KioskPOS-Native/1.0` user-agent
- Keep screen on at `/pos`, sync failure notifications, share receipt
- Device settings at `/settings/device`

**iOS differences:** no hardware back button (use swipe-back or in-app navigation). Status bar style is dark; background tint is Android-only.

## Project paths

| Path | Purpose |
|------|---------|
| `mobile/ios/` | Xcode workspace (`App.xcworkspace`) |
| `mobile/ios/App/App/Info.plist` | Permissions, URL scheme, ATS |
| `mobile/ios/App/App/App.entitlements` | Associated Domains (Universal Links) |
| `mobile/capacitor.config.ts` | WebView URL & plugins (generated) |
| `mobile/scripts/write-capacitor-config.mjs` | `production` / `local` / `local-ios` |
| `docs/APP_STORE.md` | TestFlight & App Store |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `xcodebuild requires Xcode` | Install Xcode; run `sudo xcode-select -s /path/to/Xcode.app/Contents/Developer` (see Prerequisites for external-drive paths) |
| `pod install` fails | Run `cd mobile/ios/App && pod install --repo-update` |
| White screen | Check network; open `https://kioskpos.shop` in Safari on the device |
| Simulator local dev blank | Run `npm run dev` on the Mac; use `npm run run:local:ios` (not Android `10.0.2.2` config) |
| No bottom nav | Deploy latest web to production, or use local dev config; force-quit and reopen the app |
| Google sign-in opens Safari | Add `kioskpos://auth/callback` to Supabase redirect URLs |
| Barcode scanner black screen | Allow Camera when prompted; Settings → Privacy → Camera → Kiosk POS |
| Universal Links open Safari | Verify Team ID in `apple-app-site-association`, deploy, reinstall app |
| Signing errors | Select your Team in Xcode → Signing & Capabilities → Automatic signing |

## Related docs

- [ANDROID_APP.md](./ANDROID_APP.md) — Android shell (same web app)
- [APP_STORE.md](./APP_STORE.md) — release checklist
