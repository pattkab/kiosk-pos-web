"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  LogOut,
  PlusCircle,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrganization } from "@/hooks/use-organization";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { getBusinessTypeLabel } from "@/lib/business-types";
import { getUserErrorMessage } from "@/lib/errors/user-message";

export default function SelectOrganizationPage() {
  const {
    organizations,
    activeOrganization,
    switchOrganization,
    isLoading,
    error,
    refetch,
  } = useActiveOrganization();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProceeding, setIsProceeding] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const effectiveSelectedId =
    selectedId ?? activeOrganization?.id ?? organizations[0]?.id ?? null;

  const selectedOrganization = useMemo(
    () =>
      organizations.find(
        (organization) => organization.id === effectiveSelectedId,
      ) ?? null,
    [effectiveSelectedId, organizations],
  );

  const proceedToDashboard = () => {
    if (!selectedOrganization) return;
    setIsProceeding(true);
    switchOrganization(selectedOrganization.id);
    window.location.assign("/dashboard");
  };

  const exploreWithoutOrganization = () => {
    setIsProceeding(true);
    window.location.assign("/dashboard");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/50 px-4 py-8 sm:py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Select organization</CardTitle>
          <CardDescription>
            Choose the business workspace you want to use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium">Could not load your organizations.</p>
              <p className="mt-1">
                {getUserErrorMessage(
                  error,
                  "We could not load your organizations right now.",
                )}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </div>
          ) : organizations.length === 0 ? (
            <div className="rounded-md border p-5 text-center">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">No organizations found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first organization to continue.
              </p>
              <Button className="mt-5" asChild>
                <Link href="/onboarding">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create organization
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {organizations.map((organization) => {
                const selected = organization.id === effectiveSelectedId;
                return (
                  <div
                    key={organization.id}
                    className={cn(
                      "rounded-md border bg-background p-4 transition hover:border-primary/60 hover:bg-muted/40",
                      selected && "border-primary bg-primary/5",
                    )}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      onClick={() => setSelectedId(organization.id)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {organization.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getBusinessTypeLabel(organization.business_type)} ·{" "}
                          {organization.slug} ·{" "}
                          <span className="capitalize">
                            {organization.role}
                          </span>
                        </p>
                      </div>
                      <Check
                        className={cn(
                          "h-5 w-5 text-primary",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </button>
                    {selected &&
                    ["owner", "admin"].includes(organization.role) ? (
                      <div className="mt-4 grid gap-2 border-t pt-3 sm:flex sm:flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={() => switchOrganization(organization.id)}
                          className="justify-start"
                        >
                          <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Edit organization
                          </Link>
                        </Button>
                        {organization.role === "owner" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            onClick={() => switchOrganization(organization.id)}
                            className="justify-start"
                          >
                            <Link href="/settings/danger">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t pt-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/onboarding">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create another organization
                </Link>
              </Button>
              {organizations.length > 0 ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={!selectedOrganization || isProceeding}
                  onClick={proceedToDashboard}
                >
                  {isProceeding ? "Opening dashboard..." : "Proceed to Dashboard"}
                </Button>
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  variant="secondary"
                  disabled={isProceeding}
                  onClick={exploreWithoutOrganization}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isProceeding ? "Opening..." : "Explore app without organization"}
                </Button>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                disabled={isSigningOut}
                onClick={async () => {
                  setIsSigningOut(true);
                  try {
                    await signOut();
                  } finally {
                    setIsSigningOut(false);
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
