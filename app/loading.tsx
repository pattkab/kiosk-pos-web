import { Loader2 } from "lucide-react";

export default function GlobalRouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading, please wait...
      </div>
    </div>
  );
}
