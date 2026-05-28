"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationStore } from "@/store/use-organization-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  LayoutDashboard,
  PackagePlus,
  Users,
} from "lucide-react";
import {
  businessTypes,
  businessTypeValues,
  getBusinessTypeLabel,
} from "@/lib/business-types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCurrencyCodes } from "@/lib/currencies";

const onboardingSchema = z
  .object({
    name: z.string().min(2, "Organization name must be at least 2 characters"),
    slug: z
      .string()
      .min(2, "Slug must be at least 2 characters")
      .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
    business_type: z.enum(businessTypeValues, {
      required_error: "Business type is required",
    }),
    business_type_other: z.string().trim().optional(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a valid 3-letter currency code"),
  })
  .superRefine((values, context) => {
    if (
      values.business_type === "other" &&
      (!values.business_type_other || values.business_type_other.length < 2)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your business type",
        path: ["business_type_other"],
      });
    }
  });

const currencies = getCurrencyCodes();

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
  const setActiveOrganizationId = useOrganizationStore(
    (state) => state.setActiveOrganizationId,
  );
  const setActiveCurrency = useOrganizationStore(
    (state) => state.setActiveCurrency,
  );

  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      slug: "",
      business_type: "supermarket_or_shop",
      business_type_other: "",
      currency: "USD",
    },
  });
  const organizationName = useWatch({ control: form.control, name: "name" });
  const selectedBusinessType = useWatch({
    control: form.control,
    name: "business_type",
  });

  async function onOrgSubmit(values: z.infer<typeof onboardingSchema>) {
    setIsLoading(true);
    try {
      const { data: organizationId, error } = await supabase.rpc(
        "create_organization_with_owner",
        {
          p_name: values.name,
          p_slug: values.slug,
          p_business_type:
            values.business_type === "other"
              ? `other:${values.business_type_other?.trim()}`
              : values.business_type,
          p_currency: values.currency,
        },
      );

      if (error) throw error;
      if (!organizationId)
        throw new Error("Organization could not be created.");

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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/50 px-4 py-8">
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Welcome to Kiosk POS</h1>
        <p className="text-muted-foreground mt-2">Step {step} of 2</p>
      </div>

      <Card className="w-full max-w-2xl">
        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Let's set up your business profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onOrgSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Kampala Corner Store"
                            {...field}
                            onChange={(event) => {
                              field.onChange(event);
                              if (!form.formState.dirtyFields.slug) {
                                form.setValue(
                                  "slug",
                                  slugify(event.target.value),
                                  { shouldValidate: true },
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace slug</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="kampala-corner-store"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="business_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business type</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value !== "other") {
                                form.setValue("business_type_other", "", {
                                  shouldValidate: true,
                                });
                              }
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {selectedBusinessType === "other" ? (
                      <FormField
                        control={form.control}
                        name="business_type_other"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specify business type</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Electronics wholesaler"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {field.value || "Select currency"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput placeholder="Search currency..." />
                                <CommandList>
                                  <CommandEmpty>No currency found.</CommandEmpty>
                                  <CommandGroup>
                                    {currencies.map((currency) => (
                                      <CommandItem
                                        key={currency}
                                        value={currency}
                                        onSelect={() => {
                                          form.setValue("currency", currency, {
                                            shouldValidate: true,
                                          });
                                          setCurrencyOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={
                                            field.value === currency
                                              ? "mr-2 h-4 w-4 opacity-100"
                                              : "mr-2 h-4 w-4 opacity-0"
                                          }
                                        />
                                        {currency}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
              <CardDescription>
                Finish setup now or continue to the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {organizationName || form.getValues("name")} has been
                      created.
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-primary">
                      {getBusinessTypeLabel(form.getValues("business_type"))} ·{" "}
                      {form.getValues("currency")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add products first if you are setting up stock, or go to
                      checkout and open a register when you are ready to sell.
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
                    window.location.assign("/team");
                  }}
                >
                  <Users className="h-5 w-5" />
                  <span>
                    <span className="block font-bold">Invite team</span>
                    <span className="block text-xs text-muted-foreground">
                      Set roles and staff access
                    </span>
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
                  <PackagePlus className="h-5 w-5" />
                  <span>
                    <span className="block font-bold">Add products</span>
                    <span className="block text-xs text-muted-foreground">
                      Create catalog and stock
                    </span>
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
