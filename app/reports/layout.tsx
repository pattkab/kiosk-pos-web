import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
