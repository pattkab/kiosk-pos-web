"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useActiveOrganization,
  useOrganizationSettings,
} from "@/hooks/use-organization";
import {
  organizationProfileSchema,
  OrganizationProfileValues,
} from "@/validators/organization";
import { businessTypes, normalizeBusinessType } from "@/lib/business-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GeneralSettings() {
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();
  const form = useForm<OrganizationProfileValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      name: "",
      slug: "",
      business_type: "other",
      logo_url: "",
      currency: "USD",
      timezone: "UTC",
      address: "",
      phone: "",
      email: "",
      tax_id: "",
    },
  });

  useEffect(() => {
    if (activeOrganization) {
      form.reset({
        name: activeOrganization.name,
        slug: activeOrganization.slug,
        business_type: normalizeBusinessType(activeOrganization.business_type),
        logo_url: activeOrganization.logo_url ?? "",
        currency: activeOrganization.currency ?? "USD",
        timezone: activeOrganization.timezone ?? "UTC",
        address: activeOrganization.address ?? "",
        phone: activeOrganization.phone ?? "",
        email: activeOrganization.email ?? "",
        tax_id: activeOrganization.tax_id ?? "",
      });
    }
  }, [activeOrganization, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) =>
            settings.updateProfile.mutate(values),
          )}
        >
          <div className="space-y-2">
            <Label>Business type</Label>
            <Select
              value={form.watch("business_type")}
              onValueChange={(value) =>
                form.setValue(
                  "business_type",
                  value as OrganizationProfileValues["business_type"],
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {[
            ["name", "Name"],
            ["slug", "Slug"],
            ["logo_url", "Logo URL"],
            ["currency", "Currency"],
            ["timezone", "Timezone"],
            ["address", "Address"],
            ["phone", "Phone"],
            ["email", "Email"],
            ["tax_id", "Tax ID"],
          ].map(([name, label]) => (
            <div key={name} className="space-y-2">
              <Label>{label}</Label>
              <Input
                {...form.register(name as keyof OrganizationProfileValues)}
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button disabled={settings.updateProfile.isPending}>
              Save organization
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
