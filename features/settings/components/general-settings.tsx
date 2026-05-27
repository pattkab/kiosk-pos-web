"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveOrganization, useOrganizationSettings } from "@/hooks/use-organization";
import { organizationProfileSchema, OrganizationProfileValues } from "@/validators/organization";

export function GeneralSettings() {
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();
  const form = useForm<OrganizationProfileValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      name: "",
      slug: "",
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
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => settings.updateProfile.mutate(values))}>
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
              <Input {...form.register(name as keyof OrganizationProfileValues)} />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button disabled={settings.updateProfile.isPending}>Save organization</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
