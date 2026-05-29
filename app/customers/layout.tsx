import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
