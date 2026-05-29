/** Native store listing identifiers — update iOS app id after App Store Connect publish. */
export const NATIVE_APP_STORE = {
  androidPackageId: "shop.kioskpos.app",
  /** Set when the iOS app is live on the App Store (numeric Apple ID). */
  iosAppStoreId: "",
} as const;

export function getPlayStoreUrl(packageId = NATIVE_APP_STORE.androidPackageId) {
  return `https://play.google.com/store/apps/details?id=${packageId}`;
}

export function getPlayStoreMarketUrl(packageId = NATIVE_APP_STORE.androidPackageId) {
  return `market://details?id=${packageId}`;
}

export function getAppStoreUrl(appStoreId = NATIVE_APP_STORE.iosAppStoreId) {
  if (appStoreId) {
    return `https://apps.apple.com/app/id${appStoreId}?action=write-review`;
  }
  return "https://apps.apple.com/us/search?term=Kiosk+POS";
}

export function getNativeStoreReviewUrl(platform: "android" | "ios") {
  return platform === "android" ? getPlayStoreUrl() : getAppStoreUrl();
}
