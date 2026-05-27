"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { signIn } from "@/lib/auth/actions";
import { toast } from "sonner";
import { Building2, LockKeyhole, Store } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      toast.info(message);
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    const result = await signIn(values);
    if (result.success) {
      (router.replace ?? router.push)("/select-organization");
      router.refresh?.();
      return;
    }
    setIsLoading(false);
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
      <div className="hidden flex-col justify-between border-r bg-slate-950 p-10 text-white lg:flex">
        <Link href="/" className="flex w-fit items-center gap-3 text-lg font-black">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-slate-950">K</span>
          Kiosk POS
        </Link>
        <div className="max-w-xl">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-white/10">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Open the right store, fast.</h1>
          <p className="mt-4 text-lg text-slate-300">
            Choose an organization, then jump straight into checkout, stock control, and daily reporting.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-slate-300">
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-4 w-4 text-emerald-300" />
            Role-aware access for every workspace
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="h-4 w-4 text-emerald-300" />
            Multi-organization switching after login
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="space-y-1">
          <Link href="/" className="mb-6 flex w-fit items-center gap-2 font-black text-primary lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">K</span>
            Kiosk POS
          </Link>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Continue to your organization workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input autoComplete="current-password" type="password" showPasswordToggle={false} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription>Preparing your secure sign-in...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
