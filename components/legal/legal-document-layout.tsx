import Link from "next/link";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal/constants";

type LegalDocumentLayoutProps = {
  title: string;
  children: React.ReactNode;
  footerLinks?: React.ReactNode;
};

export function LegalDocumentLayout({
  title,
  children,
  footerLinks,
}: LegalDocumentLayoutProps) {
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
            <Link href="/login?mode=create" className="text-muted-foreground hover:text-foreground">
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective date: {LEGAL_EFFECTIVE_DATE}
        </p>
        {footerLinks ? (
          <p className="mt-2 text-sm text-muted-foreground">{footerLinks}</p>
        ) : null}

        <div className="mt-10 space-y-10 text-sm leading-7 text-muted-foreground sm:text-base">
          {children}
        </div>
      </main>

      <footer className="border-t bg-white py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Kiosk POS. All rights reserved.</p>
      </footer>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="text-primary hover:underline">
      {children}
    </a>
  );
}
