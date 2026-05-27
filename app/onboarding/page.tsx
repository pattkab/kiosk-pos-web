"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationStore } from "@/store/use-organization-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Building2, CheckCircle2, LayoutDashboard, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const onboardingSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  currency: z.string().min(1, "Currency is required"),
});

const currencies = ["USD", "UGX", "KES", "TZS", "EUR", "GBP"];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const supabase = createClient();
  const setActiveOrganizationId = useOrganizationStore((state) => state.setActiveOrganizationId);
  const setActiveCurrency = useOrganizationStore((state) => state.setActiveCurrency);

  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      slug: "",
      currency: "USD",
    },
  });
  const organizationName = useWatch({ control: form.control, name: "name" });

  async function onOrgSubmit(values: z.infer<typeof onboardingSchema>) {
    setIsLoading(true);
    try {
      const { data: organizationId, error } = await supabase.rpc("create_organization_with_owner", {
        p_name: values.name,
        p_slug: values.slug,
        p_currency: values.currency,
      });

      if (error) throw error;
      if (!organizationId) throw new Error("Organization could not be created.");

      setOrgId(organizationId as string);
      setActiveOrganizationId(organizationId as string);
      setActiveCurrency(values.currency);
      setStep(2);
      toast.success("Organization created!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Welcome to Kiosk POS</h1>
        <p className="text-muted-foreground mt-2">Step {step} of 2</p>
      </div>

      <Card className="w-full max-w-lg">
        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Let's set up your business profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onOrgSubmit)} className="space-y-6">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Kampala Corner Store"
                          {...field}
                          onChange={(event) => {
                            field.onChange(event);
                            if (!form.formState.dirtyFields.slug) {
                              form.setValue("slug", slugify(event.target.value), { shouldValidate: true });
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace slug</FormLabel>
                      <FormControl><Input placeholder="kampala-corner-store" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Next Step"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Workspace ready</CardTitle>
              <CardDescription>Finish setup now or continue to the dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{organizationName || form.getValues("name")} has been created.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add products first if you are setting up stock, or go to checkout and open a register when you are ready to sell.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-auto justify-start gap-3 p-4 text-left"
                  onClick={() => {
                    setIsNavigating(true);
                    if (orgId) setActiveOrganizationId(orgId);
                    setActiveCurrency(form.getValues("currency"));
                    window.location.assign("/settings/team");
                  }}
                >
                  <Users className="h-5 w-5" />
                  <span>
                    <span className="block font-bold">Invite team</span>
                    <span className="block text-xs text-muted-foreground">Set roles and staff access</span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto justify-start gap-3 p-4 text-left"
                  onClick={() => {
                    setIsNavigating(true);
                    if (orgId) setActiveOrganizationId(orgId);
                    setActiveCurrency(form.getValues("currency"));
                    window.location.assign("/inventory");
                  }}
                >
                  <Building2 className="h-5 w-5" />
                  <span>
                    <span className="block font-bold">Add products</span>
                    <span className="block text-xs text-muted-foreground">Create catalog and stock</span>
                  </span>
                </Button>
              </div>

              <Button
                className="w-full"
                disabled={isNavigating}
                onClick={() => {
                  setIsNavigating(true);
                  if (orgId) setActiveOrganizationId(orgId);
                  setActiveCurrency(form.getValues("currency"));
                  window.location.assign("/dashboard");
                }}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {isNavigating ? "Opening..." : "Go to dashboard"}
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
