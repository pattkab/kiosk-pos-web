import { Suspense } from "react";
import { JoinCustomerPage } from "@/features/loyalty/components/join-customer-page";

export default function JoinCustomerRoutePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <JoinCustomerPage />
    </Suspense>
  );
}
