"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReportAccess } from "@/hooks/use-reports";
import { BarChart3, Lock } from "lucide-react";
import Link from "next/link";

export function ReportGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, canViewReports } = useReportAccess();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!canViewReports) {
    return (
      <Card>
        <CardContent className="flex min-h-[420px] flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Reports are restricted</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Reports are available to owners, admins, and managers. Cashier accounts can continue using checkout.
          </p>
          <Button asChild className="mt-6">
            <Link href="/pos">
              <BarChart3 className="mr-2 h-4 w-4" />
              Return to POS
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
