# Google Play closed testing

Use this after you have a signed release AAB (`docs/ANDROID_RELEASE.md`).

## 1. Create the app in Play Console

1. [Google Play Console](https://play.google.com/console) → **Create app**
2. App name: **Kiosk POS**
3. Default language: English
4. App or game: **App**
5. Free or paid: **Free** (billing is via Stripe on web)

## 2. Store listing (minimum)

| Field | Value |
|-------|--------|
| Short description | Offline-first POS for shops — checkout, inventory, sync. |
| Full description | Use bullets from landing page: POS, inventory, offline sales, Yo payments, multi-org. |
| App icon | 512×512 PNG (export from `mobile/android` launcher assets) |
| Feature graphic | 1024×500 PNG |
| Screenshots | Phone + 7" tablet: login, POS, receipt, settings/device |
| Privacy policy | `https://kioskpos.shop/privacy` |
| Category | Business |

## 3. Upload signed AAB

```bash
# After keystore.properties is configured (see keystore.properties.example)
cd mobile
npm run config:prod && npm run sync
npm run build:release
```

Upload: `mobile/android/app/build/outputs/bundle/release/app-release.aab`

## 4. Closed testing track

1. **Testing → Closed testing** → Create track (e.g. "Shop pilot")
2. Add tester emails (2–3 shop owners)
3. Share opt-in link with testers
4. Roll out release to closed track first (not production)

## 5. Pre-launch checklist

- [ ] `assetlinks.json` includes **release** keystore SHA-256
- [ ] Supabase redirect URLs include `kioskpos://auth/callback`
- [ ] Test on physical device: login → POS → offline sale → sync → Bluetooth receipt
- [ ] Content rating questionnaire completed
- [ ] Target API level meets Play requirements (SDK 35 configured)

## 6. Promote to production

After 1–2 weeks of closed testing with no blockers:

1. **Promote release** from closed → production
2. Start with **staged rollout** (e.g. 20% → 100%)
3. Monitor Play Console vitals (crashes, ANRs)

## Package

- **Application ID:** `shop.kioskpos.app`
- **Current version:** see `mobile/android/app/build.gradle` (`versionName` / `versionCode`)
