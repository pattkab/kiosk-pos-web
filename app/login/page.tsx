"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  Chrome,
  LockKeyhole,
  ReceiptText,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn, signInWithGoogle } from "@/lib/auth/actions";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  async function onGoogleSignIn() {
    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh bg-[#f7f8fb] lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
      <div className="relative hidden overflow-hidden bg-[#10131a] text-white lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(#ffffff0d_1px,transparent_1px),linear-gradient(90deg,#ffffff0d_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative flex min-h-dvh flex-col justify-between p-10 xl:p-12">
          <Link
            href="/"
            className="flex w-fit items-center gap-3 text-lg font-black"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#10131a]">
              K
            </span>
            Kiosk POS
          </Link>

          <div className="grid gap-8">
            <div className="max-w-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20">
                <Store className="h-8 w-8" />
              </div>
              <p className="mb-3 text-sm font-black uppercase tracking-widest text-emerald-200">
                Stock, sell, report
              </p>
              <h1 className="max-w-xl text-5xl font-black leading-tight tracking-tight">
                Open the right workspace and keep the day moving.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
                Fast checkout, business-aware inventory categories, register
                controls, and clear daily reporting in one calm workspace.
              </p>
            </div>

            <div className="grid max-w-3xl gap-3 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-md border border-white/10 bg-white/[0.06] p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Today
                    </p>
                    <p className="mt-1 text-2xl font-black">UGX 2.84M</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-emerald-200" />
                </div>
                <div className="mt-5 grid grid-cols-7 items-end gap-1">
                  {[34, 52, 45, 68, 58, 81, 73].map((height, index) => (
                    <div
                      key={index}
                      className="rounded-sm bg-emerald-300/80"
                      style={{ height }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-md border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center gap-3">
                    <Boxes className="h-5 w-5 text-sky-200" />
                    <div>
                      <p className="font-black">42 low-stock checks</p>
                      <p className="text-sm text-slate-400">
                        Restock before checkout slows down.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center gap-3">
                    <ReceiptText className="h-5 w-5 text-amber-200" />
                    <div>
                      <p className="font-black">Register locked safely</p>
                      <p className="text-sm text-slate-400">
                        Cash sessions stay accountable.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
      </div>

      <div className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-8">
        <Card className="w-full max-w-md overflow-hidden border bg-white shadow-xl shadow-slate-200/60">
          <CardHeader className="space-y-1 border-b bg-[#fbfcff] p-6">
            <Link
              href="/"
              className="mb-5 flex w-fit items-center gap-2 font-black text-primary lg:hidden"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                K
              </span>
              Kiosk POS
            </Link>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={28}
                height={28}
                className="rounded"
              />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in to checkout, stock control, and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <Button
                  variant="outline"
                  className="h-11 w-full font-semibold"
                  type="button"
                  disabled={isGoogleLoading || isLoading}
                  onClick={onGoogleSignIn}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  {isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or sign in with email</span>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="email"
                          className="h-11"
                          placeholder="name@store.com"
                          {...field}
                        />
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
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          autoComplete="current-password"
                          className="h-11"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  className="h-11 w-full font-black"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
            <div className="mt-5 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Your workspace, roles, and register session load after sign
                  in.
                </span>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
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
              <CardDescription>
                Preparing your secure sign-in...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
