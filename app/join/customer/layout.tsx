import { CustomerWalletShell } from "@/features/loyalty/components/customer-wallet-shell";

export default function JoinCustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerWalletShell>{children}</CustomerWalletShell>;
}
