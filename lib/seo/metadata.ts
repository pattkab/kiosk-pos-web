import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from "@/lib/seo/site";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
};

export function createPageMetadata(options: PageMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const description = options.description ?? SITE_DESCRIPTION;
  const canonical = options.path ? `${siteUrl}${options.path}` : siteUrl;
  const ogImage = options.ogImage ?? DEFAULT_OG_IMAGE_PATH;
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`;
  const title =
    options.path === "/"
      ? options.title
      : `${options.title} | ${SITE_NAME}`;

  return {
    title,
    description,
    keywords: options.keywords ?? SITE_KEYWORDS,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical,
    },
    robots: options.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: options.path === "/" ? "website" : "article",
      locale: "en_UG",
      alternateLocale: ["en_US", "en_GB"],
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — Point of Sale and inventory dashboard`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    category: "business",
  };
}

export const rootMetadata: Metadata = {
  ...createPageMetadata({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    path: "/",
  }),
  applicationName: SITE_NAME,
  authors: [{ name: "Kiosk POS", url: getSiteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};
