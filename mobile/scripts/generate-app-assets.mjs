#!/usr/bin/env node
/**
 * Generate Android/iOS launcher icons, splash screens, and PWA icons
 * from mobile/resources/app-icon.png
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(MOBILE_ROOT, "..");
const SOURCE = path.join(MOBILE_ROOT, "resources/app-icon.png");
const ANDROID_RES = path.join(MOBILE_ROOT, "android/app/src/main/res");
const PUBLIC_ICONS = path.join(REPO_ROOT, "public/icons");
const IOS_ICON = path.join(
  MOBILE_ROOT,
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
);
const IOS_SPLASH_DIR = path.join(
  MOBILE_ROOT,
  "ios/App/App/Assets.xcassets/Splash.imageset",
);

export const BRAND_BACKGROUND = "#1c1f26";
export const BRAND_ACCENT = "#f97316";

const LAUNCHER_SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const ADAPTIVE_SIZES = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

const SPLASH_PORT = {
  mdpi: [320, 480],
  hdpi: [480, 800],
  xhdpi: [720, 1280],
  xxhdpi: [960, 1600],
  xxxhdpi: [1280, 1920],
};

async function ensureSource() {
  try {
    await fs.access(SOURCE);
  } catch {
    throw new Error(`Missing source icon: ${SOURCE}`);
  }
}

async function writeSquareIcon(outputPath, size, scale = 1) {
  const canvas = Math.round(size);
  const iconSize = Math.round(canvas * scale);
  const offset = Math.round((canvas - iconSize) / 2);
  const icon = await sharp(SOURCE).resize(iconSize, iconSize, { fit: "contain" }).png().toBuffer();

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: BRAND_BACKGROUND,
    },
  })
    .composite([{ input: icon, left: offset, top: offset }])
    .png()
    .toFile(outputPath);
}

async function writeSplash(outputPath, width, height) {
  const iconWidth = Math.round(Math.min(width, height) * 0.62);
  const icon = await sharp(SOURCE)
    .resize(iconWidth, iconWidth, { fit: "contain" })
    .png()
    .toBuffer();

  const left = Math.round((width - iconWidth) / 2);
  const top = Math.round((height - iconWidth) / 2);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BRAND_BACKGROUND,
    },
  })
    .composite([{ input: icon, left, top }])
    .png()
    .toFile(outputPath);
}

async function generateAndroidIcons() {
  for (const [density, size] of Object.entries(LAUNCHER_SIZES)) {
    const dir = path.join(ANDROID_RES, `mipmap-${density}`);
    await fs.mkdir(dir, { recursive: true });
    await sharp(SOURCE).resize(size, size, { fit: "cover" }).png().toFile(path.join(dir, "ic_launcher.png"));
    await sharp(SOURCE).resize(size, size, { fit: "cover" }).png().toFile(path.join(dir, "ic_launcher_round.png"));
  }

  for (const [density, size] of Object.entries(ADAPTIVE_SIZES)) {
    const dir = path.join(ANDROID_RES, `mipmap-${density}`);
    await writeSquareIcon(path.join(dir, "ic_launcher_foreground.png"), size, 0.82);
  }
}

async function generateAndroidSplashes() {
  await writeSplash(path.join(ANDROID_RES, "drawable/splash.png"), 480, 800);

  for (const [density, [width, height]] of Object.entries(SPLASH_PORT)) {
    await writeSplash(path.join(ANDROID_RES, `drawable-port-${density}/splash.png`), width, height);
    await writeSplash(path.join(ANDROID_RES, `drawable-land-${density}/splash.png`), height, width);
  }
}

async function generatePublicIcons() {
  await fs.mkdir(PUBLIC_ICONS, { recursive: true });
  await sharp(SOURCE).resize(192, 192, { fit: "cover" }).png().toFile(path.join(PUBLIC_ICONS, "icon-192.png"));
  await sharp(SOURCE).resize(512, 512, { fit: "cover" }).png().toFile(path.join(PUBLIC_ICONS, "icon-512.png"));
}

async function generateIosAssets() {
  await sharp(SOURCE).resize(1024, 1024, { fit: "cover" }).png().toFile(IOS_ICON);

  const splashSize = 2732;
  await writeSplash(path.join(IOS_SPLASH_DIR, "splash-2732x2732.png"), splashSize, splashSize);
  await writeSplash(path.join(IOS_SPLASH_DIR, "splash-2732x2732-1.png"), splashSize, splashSize);
  await writeSplash(path.join(IOS_SPLASH_DIR, "splash-2732x2732-2.png"), splashSize, splashSize);
}

async function updateLauncherBackgroundColor() {
  const xmlPath = path.join(ANDROID_RES, "values/ic_launcher_background.xml");
  await fs.writeFile(
    xmlPath,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BRAND_BACKGROUND}</color>\n</resources>\n`,
  );
}

async function main() {
  await ensureSource();
  await generateAndroidIcons();
  await generateAndroidSplashes();
  await generatePublicIcons();
  await generateIosAssets();
  await updateLauncherBackgroundColor();
  console.log("Generated app icons and splash screens from mobile/resources/app-icon.png");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
