import { CustomerWalletShell } from "@/features/loyalty/components/customer-wallet-shell";

export default function MyLoyaltyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerWalletShell>{children}</CustomerWalletShell>;
}
