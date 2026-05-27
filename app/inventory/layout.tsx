import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
