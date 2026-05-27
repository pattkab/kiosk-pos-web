import Link from "next/link";

export function LegalFooterLinks() {
  return (
    <p className="text-sm text-muted-foreground">
      <Link href="/privacy" className="hover:text-foreground">
        Privacy Policy
      </Link>
      {" · "}
      <Link href="/terms" className="hover:text-foreground">
        Terms and Conditions
      </Link>
    </p>
  );
}
