"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const onboardingSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  currency: z.string().min(1, "Currency is required"),
});

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

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
                      <FormControl><Input placeholder="My Store" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl><Input placeholder="my-store" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl><Input placeholder="USD" {...field} /></FormControl>
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
              <CardTitle>Invite Team Members</CardTitle>
              <CardDescription>You can also do this later in settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="p-4 border rounded-md bg-background">
                 <p className="text-sm text-muted-foreground mb-4">Invite your colleagues to join <strong>{form.getValues('name')}</strong>.</p>
                 <div className="flex gap-2">
                   <Input placeholder="email@example.com" disabled />
                   <Button variant="secondary" disabled>Invite</Button>
                 </div>
               </div>
               <Button className="w-full" onClick={() => {
                 router.push("/dashboard");
                 router.refresh();
               }}>
                 Go to Dashboard
               </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
