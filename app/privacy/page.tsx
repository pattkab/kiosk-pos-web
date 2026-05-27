import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Kiosk POS",
  description:
    "Learn how Kiosk POS collects, uses, stores, and protects personal and business data.",
};

const sections = [
  {
    title: "1. Who we are",
    body: (
      <>
        <p>
          Kiosk POS (&quot;Kiosk POS,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides
          point-of-sale, inventory, reporting, and team management tools for businesses. This
          Privacy Policy explains how we collect, use, share, and protect personal data when you use
          our website, applications, and related services (collectively, the &quot;Services&quot;).
        </p>
        <p>By using Kiosk POS, you agree to this Privacy Policy.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Website:</strong>{" "}
            <a href="https://kiospos.shop" className="text-primary hover:underline">
              kiospos.shop
            </a>
          </li>
          <li>
            <strong>Privacy contact:</strong>{" "}
            <a href="mailto:privacy@kiospos.shop" className="text-primary hover:underline">
              privacy@kiospos.shop
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "2. Information we collect",
    body: (
      <>
        <p>We may collect the following categories of information:</p>
        <h3 className="mt-4 font-semibold">Account and organization information</h3>
        <p>
          Name, email address, authentication details, business or organization name, profile
          settings, team member names, roles, invitations, and access permissions.
        </p>
        <h3 className="mt-4 font-semibold">Transaction and operational data</h3>
        <p>
          Sales and checkout details, product and inventory records, pricing, stock adjustments,
          register sessions, payments, receipts, and analytics generated from your use of the
          Services.
        </p>
        <h3 className="mt-4 font-semibold">Billing and subscription information</h3>
        <p>
          Plan and subscription status, and payment processor metadata (for example, customer or
          subscription identifiers). We do not store full payment card numbers or card security
          codes in our systems.
        </p>
        <h3 className="mt-4 font-semibold">Authentication and security data</h3>
        <p>
          Login events, session data, device and browser metadata, IP addresses, security logs, and
          audit or activity logs used for accountability.
        </p>
        <h3 className="mt-4 font-semibold">Support and communications</h3>
        <p>Messages you send to support and operational email metadata such as delivery status.</p>
        <h3 className="mt-4 font-semibold">Technical data</h3>
        <p>
          Diagnostics, error logs, performance signals, cookies or local storage where applicable,
          and offline queue or cache data used for reliability features.
        </p>
      </>
    ),
  },
  {
    title: "3. How we use information",
    body: (
      <>
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
      </>
    ),
  },
  {
    title: "4. Legal bases (where applicable)",
    body: (
      <p>
        Depending on your location, we process personal data under one or more legal bases:
        performance of a contract, legitimate interests (such as security and service improvement),
        consent where required, and compliance with legal obligations.
      </p>
    ),
  },
  {
    title: "5. Payments",
    body: (
      <p>
        Payments are processed by third-party payment providers (such as Stripe). Card details are
        collected and processed directly by the payment provider under their own privacy policy and
        security standards. We may receive limited billing metadata to manage your account and
        subscription.
      </p>
    ),
  },
  {
    title: "6. Third-party services",
    body: (
      <p>
        We use service providers for hosting, authentication, database storage, analytics, logging,
        email delivery, and payments. These providers process data on our behalf under contractual
        and security obligations.
      </p>
    ),
  },
  {
    title: "7. Data sharing",
    body: (
      <>
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
      </>
    ),
  },
  {
    title: "8. Data retention",
    body: (
      <p>
        We retain data only as long as needed to provide the Services, meet legal and accounting
        obligations, and support legitimate business needs such as security and dispute resolution.
        Data may be deleted or anonymized when no longer required.
      </p>
    ),
  },
  {
    title: "9. Security",
    body: (
      <p>
        We apply reasonable administrative, technical, and organizational safeguards, including
        access controls and encryption in transit. No method of transmission or storage is
        completely secure. You are responsible for keeping your account credentials confidential.
      </p>
    ),
  },
  {
    title: "10. International transfers",
    body: (
      <p>
        Your data may be processed in countries other than your own. Where required, we use
        appropriate safeguards for cross-border transfers in accordance with applicable law.
      </p>
    ),
  },
  {
    title: "11. Your rights",
    body: (
      <>
        <p>
          Depending on your location, you may have rights to access, correct, delete, restrict, or
          object to processing, request portability, withdraw consent where applicable, or lodge a
          complaint with a supervisory authority.
        </p>
        <p>
          To exercise your rights, contact{" "}
          <a href="mailto:privacy@kiospos.shop" className="text-primary hover:underline">
            privacy@kiospos.shop
          </a>
          . We may verify your identity before completing a request.
        </p>
      </>
    ),
  },
  {
    title: "12. Cookies and local storage",
    body: (
      <p>
        Kiosk POS may use cookies and similar technologies for authentication, session management,
        security, and performance. Some features, including offline functionality, may use local
        storage on your device. You can control cookies through browser settings, though disabling
        them may affect functionality.
      </p>
    ),
  },
  {
    title: "13. Children’s privacy",
    body: (
      <p>
        Kiosk POS is intended for business use and is not directed to children under 13 (or the
        equivalent minimum age in your jurisdiction). We do not knowingly collect personal data from
        children.
      </p>
    ),
  },
  {
    title: "14. Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. If we make material changes, we will
        update the effective date and provide additional notice where required by law.
      </p>
    ),
  },
  {
    title: "15. Contact us",
    body: (
      <p>
        For privacy questions or requests, email{" "}
        <a href="mailto:privacy@kiospos.shop" className="text-primary hover:underline">
          privacy@kiospos.shop
        </a>{" "}
        or visit{" "}
        <a href="https://kiospos.shop" className="text-primary hover:underline">
          kiospos.shop
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-dvh bg-[#f7f8fb] text-foreground">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-black text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              K
            </span>
            Kiosk POS
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link href="/register" className="text-muted-foreground hover:text-foreground">
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective date: May 28, 2026 · Last updated: May 28, 2026
        </p>

        <div className="mt-10 space-y-10 text-sm leading-7 text-muted-foreground sm:text-base">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
              <div className="mt-3 space-y-3">{section.body}</div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t bg-white py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Kiosk POS. All rights reserved.</p>
      </footer>
    </div>
  );
}
