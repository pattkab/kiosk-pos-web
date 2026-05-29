import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/dashboard",
          "/pos",
          "/inventory",
          "/reports",
          "/settings",
          "/team",
          "/notifications",
          "/onboarding",
          "/select-organization",
          "/auth/",
          "/invite/",
          "/unauthorized",
          "/session-expired",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
