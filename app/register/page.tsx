"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { signUp } from "@/lib/auth/actions";
import { CheckCircle2, ShieldCheck, Store } from "lucide-react";

const signupSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true);
    const result = await signUp(values);
    setIsLoading(false);
    if (result.success) {
      router.push("/login?message=Check your email to verify your account");
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(420px,1.05fr)_minmax(0,0.95fr)]">
      <div className="flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="space-y-1">
          <Link href="/" className="mb-6 flex w-fit items-center gap-2 font-black text-primary lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">K</span>
            Kiosk POS
          </Link>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Start with your profile. You will create or join an organization next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input autoComplete="email" placeholder="name@store.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input autoComplete="new-password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input autoComplete="new-password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
      <div className="hidden flex-col justify-between border-l bg-slate-950 p-10 text-white lg:flex">
        <Link href="/" className="flex w-fit items-center gap-3 text-lg font-black">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-slate-950">K</span>
          Kiosk POS
        </Link>
        <div className="max-w-xl">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-white/10">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Set up the store before the first sale.</h1>
          <p className="mt-4 text-lg text-slate-300">
            After verification, Kiosk POS guides you through organization setup, staff roles, products, and checkout.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-slate-300">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Secure account verification
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            Organization setup immediately after sign-in
          </div>
        </div>
      </div>
    </div>
  );
}
