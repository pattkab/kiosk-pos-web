import Link from "next/link";
import { BrandTitle } from "@/components/marketing/brand-title";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-black tracking-tight text-white">
          <BrandTitle />
        </Link>
        <nav
          className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex"
          aria-label="Primary"
        >
          <Link href="#features" className="hover:text-white">
            Features
          </Link>
          <Link href="#industries" className="hover:text-white">
            Industries
          </Link>
          <Link href="#faq" className="hover:text-white">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login?mode=create">Create account</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
