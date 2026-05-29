# Android release & Play Store (Phase C → D)

Guide for signed release builds and Google Play closed testing.

## Versioning

App version is set in `mobile/android/app/build.gradle`:

- `versionCode` — integer, increment every Play upload
- `versionName` — user-visible string (e.g. `1.1.0`)

## Release APK / AAB

### 1. Configure signing (one-time)

Create a keystore (store password and alias securely — not in git):

```bash
keytool -genkey -v \
  -keystore kiosk-pos-release.keystore \
  -alias kiosk-pos \
  -keyalg RSA -keysize 2048 -validity 10000
```

See [PLAY_STORE.md](./PLAY_STORE.md) for closed testing steps.

Copy `mobile/android/keystore.properties.example` → `keystore.properties` and fill in values.

```properties
storeFile=../../kiosk-pos-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=kiosk-pos
keyPassword=YOUR_KEY_PASSWORD
```

Add to `mobile/android/app/build.gradle` inside `android {`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
    }
}
```

Add `mobile/android/keystore.properties` and `*.keystore` to `.gitignore`.

### 2. Build release bundle (Play Store)

```bash
cd mobile
npm run config:prod
npm run sync
cd android && ./gradlew bundleRelease
```

Output: `mobile/android/app/build/outputs/bundle/release/app-release.aab`

Or from repo root after signing is configured:

```bash
npm run mobile:build:release
```

### 3. Debug install (testing)

```bash
npm run run:prod
# or
npm run mobile:install:debug
```

## Play Console checklist

| Item | Status |
|------|--------|
| App name: **Kiosk POS** | |
| Package: `shop.kioskpos.app` | ✓ |
| Privacy policy: `https://kioskpos.shop/privacy` | |
| Content rating questionnaire | |
| Target audience (business / 18+) | |
| Screenshots: phone + 7–10" tablet | |
| Feature graphic 1024×500 | |
| Closed testing track (2–3 shops) | |
| App signing by Google Play | Recommended |

## App Links (production)

After creating a **release** keystore, add its SHA-256 fingerprint to:

`public/.well-known/assetlinks.json`

Get fingerprint:

```bash
keytool -list -v -keystore kiosk-pos-release.keystore -alias kiosk-pos
```

Deploy web app so `https://kioskpos.shop/.well-known/assetlinks.json` includes both debug and release fingerprints.

## Supabase (native OAuth)

Redirect URLs:

- `kioskpos://auth/callback`
- `kioskpos://**`
- `https://kioskpos.shop/**`

## Phase D (done in app)

- Bluetooth ESC/POS via `capacitor-thermal-printer` (Settings → Device & app)
- Release signing scaffold in `mobile/android/app/build.gradle`
- App resume triggers offline sync retry

## Phase E (next)

- Firebase Cloud Messaging for push when app is killed
- In-app update prompts via Play Core
- Play Console closed testing walkthrough
