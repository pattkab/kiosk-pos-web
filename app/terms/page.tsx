import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDocumentLayout,
  LegalLink,
  LegalSection,
} from "@/components/legal/legal-document-layout";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Terms and Conditions | Kiosk POS",
  description:
    "Terms and conditions governing your use of Kiosk POS point-of-sale and inventory services.",
};

export default function TermsPage() {
  return (
    <LegalDocumentLayout
      title="Terms and Conditions"
      footerLinks={
        <>
          See also our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </>
      }
    >
      <LegalSection title="1. Agreement to terms">
        <p>
          These Terms and Conditions (&quot;Terms&quot;) govern access to and use of the Kiosk POS
          website, applications, and related services (collectively, the &quot;Services&quot;)
          operated by Kiosk POS (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating
          an account, subscribing, or using the Services, you agree to these Terms and our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p>
          If you use the Services on behalf of a business or organization, you represent that you
          have authority to bind that entity to these Terms.
        </p>
      </LegalSection>

      <LegalSection title="2. The Services">
        <p>
          Kiosk POS provides cloud-based point-of-sale, inventory, reporting, team management, and
          related business tools. Features may change over time. We may add, modify, or discontinue
          features with reasonable notice where practicable.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and security">
        <p>
          You must provide accurate registration information and keep your credentials confidential.
          You are responsible for activity under your account and for configuring team roles and
          permissions appropriately within your organization.
        </p>
        <p>
          Notify us promptly at{" "}
          <LegalLink href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</LegalLink> if you suspect
          unauthorized access.
        </p>
      </LegalSection>

      <LegalSection title="4. Subscriptions and billing">
        <p>
          New organizations can use the Starter plan for free. Paid plans unlock higher limits and
          advanced operational features such as more users, more registers, advanced reporting,
          branch workflows, audit logs, and specialized pharmacy or restaurant workflows.
        </p>
        <p>
          When paid billing is enabled and you subscribe, you authorize us and our payment processor
          to charge applicable fees on the selected billing cycle until you cancel in accordance with
          these Terms.
        </p>
        <p>
          Payments may be processed by third-party providers. Taxes may apply depending on your
          location. Except where required by law, fees are non-refundable once a billing period has
          started.
        </p>
        <p>
          You may manage or cancel subscriptions through account billing settings or the payment
          provider customer portal where available.
        </p>
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the Services unlawfully or in violation of applicable regulations</li>
          <li>Attempt to gain unauthorized access to systems, accounts, or data</li>
          <li>Interfere with or disrupt the integrity or performance of the Services</li>
          <li>Upload malware, abusive content, or material that infringes third-party rights</li>
          <li>Reverse engineer or scrape the Services except as permitted by law</li>
          <li>Resell or sublicense the Services without our written consent</li>
        </ul>
        <p>
          We may suspend or terminate access for conduct that risks harm to users, the Services, or
          third parties.
        </p>
      </LegalSection>

      <LegalSection title="6. Your data">
        <p>
          You retain ownership of business data you submit to the Services. You grant us a limited
          license to host, process, and display that data solely to provide and improve the
          Services, as described in our Privacy Policy.
        </p>
        <p>
          You are responsible for the accuracy of your data and for obtaining any consents required
          for personal data you upload about customers, employees, or other individuals.
        </p>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
        <p>
          The Services, software, branding, and documentation are owned by us or our licensors and
          are protected by intellectual property laws. These Terms do not grant you any right to use
          our trademarks except as needed to identify the Services in ordinary business use.
        </p>
      </LegalSection>

      <LegalSection title="8. Third-party services">
        <p>
          The Services may integrate with third-party providers (such as authentication, hosting,
          email, analytics, and payment processors). Your use of those services may be subject to
          separate terms. We are not responsible for third-party services outside our reasonable
          control.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers">
        <p>
          THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; TO THE MAXIMUM
          EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
          GUARANTEE UNINTERRUPTED OR ERROR-FREE OPERATION.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR SUPPLIERS WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS,
          REVENUE, DATA, OR GOODWILL. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS
          OR THE SERVICES WILL NOT EXCEED THE AMOUNTS YOU PAID US FOR THE SERVICES IN THE TWELVE
          (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR ONE HUNDRED U.S. DOLLARS (USD
          $100) IF YOU HAVE NOT PAID FEES, WHICHEVER IS GREATER.
        </p>
        <p>
          Some jurisdictions do not allow certain limitations; in those cases, our liability is
          limited to the fullest extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="11. Indemnification">
        <p>
          You will defend and indemnify us against claims, damages, and expenses (including
          reasonable legal fees) arising from your use of the Services, your data, or your violation
          of these Terms or applicable law, except to the extent caused by our gross negligence or
          willful misconduct.
        </p>
      </LegalSection>

      <LegalSection title="12. Suspension and termination">
        <p>
          You may stop using the Services at any time. We may suspend or terminate access if you
          breach these Terms, fail to pay fees when due, or if continued provision poses legal or
          security risk. Upon termination, your right to access the Services ends; we may delete or
          retain data as described in our Privacy Policy and applicable law.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to these Terms">
        <p>
          We may update these Terms from time to time. If changes are material, we will provide
          notice through the Services or by email where appropriate. Continued use after the
          effective date of updated Terms constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection title="14. Governing law">
        <p>
          These Terms are governed by the laws applicable in the jurisdiction where Kiosk POS is
          established, without regard to conflict-of-law rules. Courts in that jurisdiction will have
          exclusive venue for disputes, unless mandatory consumer protection laws in your country
          require otherwise.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>
          Questions about these Terms:{" "}
          <LegalLink href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</LegalLink>
          {" · "}
          <LegalLink href={SITE_URL}>{SITE_URL.replace("https://", "")}</LegalLink>
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
