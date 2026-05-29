import { describe, expect, it } from "vitest";
import { createPageMetadata } from "@/lib/seo/metadata";
import { PUBLIC_ROUTES, SITE_KEYWORDS } from "@/lib/seo/site";

describe("SEO metadata", () => {
  it("builds canonical and open graph fields", () => {
    const metadata = createPageMetadata({
      title: "Privacy Policy",
      description: "Privacy for Kiosk POS",
      path: "/privacy",
    });

    expect(metadata.title).toContain("Privacy Policy");
    expect(metadata.description).toBe("Privacy for Kiosk POS");
    expect(metadata.alternates?.canonical).toContain("/privacy");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });

  it("marks noindex pages", () => {
    const metadata = createPageMetadata({
      title: "Login",
      path: "/login",
      noIndex: true,
    });
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("lists indexable public routes for sitemap", () => {
    expect(PUBLIC_ROUTES.map((route) => route.path)).toEqual([
      "/",
      "/privacy",
      "/terms",
    ]);
    expect(SITE_KEYWORDS.length).toBeGreaterThan(5);
  });
});
