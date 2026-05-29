import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function SelectOrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
