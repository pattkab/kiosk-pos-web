import Link from "next/link";
import {
  LegalDocumentLayout,
  LegalLink,
  LegalSection,
} from "@/components/legal/legal-document-layout";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/legal/constants";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how Kiosk POS collects, uses, stores, and protects personal and business data for Point of Sale and inventory services.",
  path: "/privacy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      footerLinks={
        <>
          Use of the Services is also governed by our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms and Conditions
          </Link>
          .
        </>
      }
    >
      <LegalSection title="1. Who we are">
        <p>
          Kiosk POS (&quot;Kiosk POS,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides
          point-of-sale, inventory, reporting, and team management tools for businesses. This
          Privacy Policy explains how we collect, use, share, and protect personal data when you use
          our website, applications, and related services (collectively, the &quot;Services&quot;).
        </p>
        <p>
          By using Kiosk POS, you agree to this Privacy Policy and our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms and Conditions
          </Link>
          .
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Website:</strong>{" "}
            <LegalLink href={SITE_URL}>{SITE_URL.replace("https://", "")}</LegalLink>
          </li>
          <li>
            <strong>Support:</strong>{" "}
            <LegalLink href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</LegalLink>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>We may collect the following categories of information:</p>
        <h3 className="mt-4 font-semibold text-foreground">Account and organization information</h3>
        <p>
          Name, email address, authentication details, business or organization name, profile
          settings, team member names, roles, invitations, and access permissions.
        </p>
        <h3 className="mt-4 font-semibold text-foreground">Transaction and operational data</h3>
        <p>
          Sales and checkout details, product and inventory records, pricing, stock adjustments,
          register sessions, payments, receipts, and analytics generated from your use of the
          Services.
        </p>
        <h3 className="mt-4 font-semibold text-foreground">Billing and subscription information</h3>
        <p>
          Plan and subscription status, and payment processor metadata (for example, customer or
          subscription identifiers). We do not store full payment card numbers or card security
          codes in our systems.
        </p>
        <h3 className="mt-4 font-semibold text-foreground">Authentication and security data</h3>
        <p>
          Login events, session data, device and browser metadata, IP addresses, security logs, and
          audit or activity logs used for accountability.
        </p>
        <h3 className="mt-4 font-semibold text-foreground">Support and communications</h3>
        <p>Messages you send to support and operational email metadata such as delivery status.</p>
        <h3 className="mt-4 font-semibold text-foreground">Technical data</h3>
        <p>
          Diagnostics, error logs, performance signals, cookies or local storage where applicable,
          and offline queue or cache data used for reliability features.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <p>We use information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide, operate, and maintain the Services</li>
          <li>Create and manage user accounts and organizations</li>
          <li>Process sales, inventory, and reporting features</li>
          <li>Authenticate users and enforce role-based permissions</li>
          <li>Send transactional communications (such as invitations and account notices)</li>
          <li>Process subscriptions and billing</li>
          <li>Detect, investigate, and prevent fraud, abuse, and security incidents</li>
          <li>Comply with legal obligations</li>
          <li>Improve product performance and user experience</li>
        </ul>
        <p className="mt-3">We do not sell personal information.</p>
      </LegalSection>

      <LegalSection title="4. Legal bases (where applicable)">
        <p>
          Depending on your location, we process personal data under one or more legal bases:
          performance of a contract, legitimate interests (such as security and service improvement),
          consent where required, and compliance with legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="5. Payments">
        <p>
          Payments are processed by third-party payment providers (such as Stripe). Card details are
          collected and processed directly by the payment provider under their own privacy policy and
          security standards. We may receive limited billing metadata to manage your account and
          subscription.
        </p>
      </LegalSection>

      <LegalSection title="6. Third-party services">
        <p>
          We use service providers for hosting, authentication, database storage, analytics, logging,
          email delivery, and payments. These providers process data on our behalf under contractual
          and security obligations.
        </p>
      </LegalSection>

      <LegalSection title="7. Data sharing">
        <p>We may share data:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>With service providers acting on our instructions</li>
          <li>Within your organization based on permissions you configure</li>
          <li>When required by law, regulation, or valid legal process</li>
          <li>To enforce our terms or protect rights, safety, and security</li>
          <li>
            In connection with a merger, acquisition, financing, or asset transfer (with notice where
            required)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Data retention">
        <p>
          We retain data only as long as needed to provide the Services, meet legal and accounting
          obligations, and support legitimate business needs such as security and dispute resolution.
          Data may be deleted or anonymized when no longer required.
        </p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          We apply reasonable administrative, technical, and organizational safeguards, including
          access controls and encryption in transit. No method of transmission or storage is
          completely secure. You are responsible for keeping your account credentials confidential.
        </p>
      </LegalSection>

      <LegalSection title="10. International transfers">
        <p>
          Your data may be processed in countries other than your own. Where required, we use
          appropriate safeguards for cross-border transfers in accordance with applicable law.
        </p>
      </LegalSection>

      <LegalSection title="11. Your rights">
        <p>
          Depending on your location, you may have rights to access, correct, delete, restrict, or
          object to processing, request portability, withdraw consent where applicable, or lodge a
          complaint with a supervisory authority.
        </p>
        <p>
          To exercise your rights, contact{" "}
          <LegalLink href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</LegalLink>. We may verify your
          identity before completing a request.
        </p>
      </LegalSection>

      <LegalSection title="12. Cookies and local storage">
        <p>
          Kiosk POS may use cookies and similar technologies for authentication, session management,
          security, and performance. Some features, including offline functionality, may use local
          storage on your device. You can control cookies through browser settings, though disabling
          them may affect functionality.
        </p>
      </LegalSection>

      <LegalSection title="13. Children’s privacy">
        <p>
          Kiosk POS is intended for business use and is not directed to children under 13 (or the
          equivalent minimum age in your jurisdiction). We do not knowingly collect personal data from
          children.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will
          update the effective date and provide additional notice where required by law.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact us">
        <p>
          For privacy questions or requests, email{" "}
          <LegalLink href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</LegalLink> or visit{" "}
          <LegalLink href={SITE_URL}>{SITE_URL.replace("https://", "")}</LegalLink>.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
