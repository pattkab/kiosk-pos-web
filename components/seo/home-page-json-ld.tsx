import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

const faqs = [
  {
    question: "What is Kiosk POS?",
    answer:
      "Kiosk POS is cloud Point of Sale and inventory software for shops, supermarkets, bars, restaurants, hotels, and rentals. It includes checkout, stock control, reports, and offline selling when internet drops.",
  },
  {
    question: "Does Kiosk POS work offline?",
    answer:
      "Yes. Kiosk POS is offline-first. You can keep selling, print receipts, and queue sales during power cuts or weak internet, then sync when you are back online.",
  },
  {
    question: "Which businesses use Kiosk POS?",
    answer:
      "Retail shops, supermarkets, bars, restaurants, cafés, pharmacies, salons, boutiques, hotels, and BnB or rental properties across Uganda and Africa.",
  },
  {
    question: "Can I accept MTN or Airtel mobile money?",
    answer:
      "Yes. Kiosk POS integrates Yo Payments Uganda for MTN Mobile Money, Airtel Money, and card collections where enabled on your merchant account.",
  },
  {
    question: "Is Kiosk POS only for Uganda?",
    answer:
      "Kiosk POS is built for African operating conditions—unstable power, mobile money, and multi-branch teams—but works anywhere you need a reliable web-based Point of Sale.",
  },
];

export function HomePageJsonLd() {
  const siteUrl = getSiteUrl();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: siteUrl,
          description: SITE_DESCRIPTION,
          inLanguage: "en",
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: siteUrl,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: siteUrl,
          logo: `${siteUrl}/icons/icon-512.png`,
          description: SITE_DESCRIPTION,
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: "support@kioskpos.shop",
            availableLanguage: ["English"],
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: SITE_NAME,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "Free trial with paid plans for advanced features",
          },
          description: SITE_DESCRIPTION,
          url: siteUrl,
          featureList: [
            "Point of Sale checkout",
            "Inventory management",
            "Offline sales and sync",
            "Multi-branch reporting",
            "Mobile money collections",
            "Barcode scanning",
          ],
          audience: {
            "@type": "BusinessAudience",
            audienceType: "Retail, hospitality, and service businesses",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }}
      />
    </>
  );
}
