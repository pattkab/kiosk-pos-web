# App Store release (iOS)

Checklist for TestFlight and App Store submission of **Kiosk POS** (`shop.kioskpos.app`).

## Before you submit

- [ ] Apple Developer Program membership ($99/year)
- [ ] Xcode project builds and runs on a physical device
- [ ] Production web app deployed at `https://kioskpos.shop`
- [ ] `apple-app-site-association` updated with your **Team ID** (not `REPLACE_WITH_APPLE_TEAM_ID`)
- [ ] Supabase redirect URLs include `kioskpos://auth/callback` and `kioskpos://**`
- [ ] Privacy policy live at `https://kioskpos.shop/privacy`

## App Store Connect setup

1. [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **+** → New App
2. Platform: **iOS**
3. Name: **Kiosk POS**
4. Primary language: English
5. Bundle ID: `shop.kioskpos.app`
6. SKU: e.g. `kioskpos-ios-001`

## Version and build numbers

Set in Xcode → App target → **General**, or in `project.pbxproj`:

- **Version** (`MARKETING_VERSION`): user-facing, e.g. `1.2.0`
- **Build** (`CURRENT_PROJECT_VERSION`): increment every upload, e.g. `3`

Keep iOS version aligned with Android where possible.

## Signing

1. Open `mobile/ios/App/App.xcworkspace` in Xcode
2. Select **App** target → **Signing & Capabilities**
3. Team: your Apple Developer team
4. **Automatically manage signing**: enabled
5. Confirm capabilities:
   - **Associated Domains** → `applinks:kioskpos.shop`

Archive for release:

```bash
cd mobile
npm run config:prod
npm run sync:ios
npm run open:ios
```

In Xcode: **Product → Archive** → **Distribute App** → App Store Connect.

## TestFlight (recommended first)

1. Upload archive from Xcode Organizer
2. App Store Connect → TestFlight → add internal testers
3. Verify: sign-in, POS checkout, barcode scan, offline queue, deep link `kioskpos://auth/callback`

## Store listing (minimum)

| Field | Value |
|-------|-------|
| Category | Business |
| Privacy policy | `https://kioskpos.shop/privacy` |
| Support URL | `https://kioskpos.shop` |
| Description | Offline-first POS and inventory for shops and restaurants |

Screenshots: iPhone 6.7" and iPad 12.9" (POS screen, inventory, reports).

## Privacy nutrition labels

Declare data collected by the hosted web app (account email, sales data synced to Supabase). The Capacitor shell itself does not add separate analytics.

Camera and Bluetooth are used on-device for barcode scanning and optional receipt printers — disclose in App Privacy questionnaire.

## Universal Links verification

After deploy, validate:

```bash
curl -I https://kioskpos.shop/.well-known/apple-app-site-association
```

Expect `Content-Type: application/json` and your Team ID in the JSON body.

Apple’s [AASA validator](https://search.developer.apple.com/appsearch-validation-tool/) can confirm the file once Team ID is set.

## Related

- [IOS_APP.md](./IOS_APP.md) — development and troubleshooting
- [PLAY_STORE.md](./PLAY_STORE.md) — Android Play Store (parallel release)
