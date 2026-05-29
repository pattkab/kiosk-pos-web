"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowRight,
  BadgeCheck,
  Chrome,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { AuthShowcase } from "@/features/auth/components/auth-showcase";
import { BrowserShellHint } from "@/components/native/browser-shell-hint";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signIn, signInWithGoogle, signUp } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "create";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const createSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() =>
    searchParams.get("mode") === "create" ? "create" : "signin",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) toast.info(message);
    const error = searchParams.get("error");
    if (error) toast.error(decodeURIComponent(error));
  }, [searchParams]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    const url = new URL(window.location.href);
    if (next === "create") {
      url.searchParams.set("mode", "create");
    } else {
      url.searchParams.delete("mode");
    }
    window.history.replaceState(null, "", url.pathname + url.search);
  };

  async function handleSignIn(values: z.infer<typeof signInSchema>) {
    setIsLoading(true);
    const result = await signIn(values);
    if (result.success) {
      (router.replace ?? router.push)("/select-organization");
      router.refresh?.();
      return;
    }
    setIsLoading(false);
  }

  async function handleCreate(values: z.infer<typeof createSchema>) {
    setIsLoading(true);
    const result = await signUp({
      full_name: values.full_name,
      email: values.email,
      password: values.password,
    });
    setIsLoading(false);
    if (result.success) {
      switchMode("signin");
      toast.success("Check your email to verify your account, then sign in.");
      signInForm.setValue("email", values.email);
    }
  }

  async function handleGoogle() {
    setIsGoogleLoading(true);
    const next = searchParams.get("next") ?? "/select-organization";
    const result = await signInWithGoogle(next);
    if (!result.success) setIsGoogleLoading(false);
  }

  const busy = isLoading || isGoogleLoading;

  return (
    <div
      className="grid min-h-dvh bg-[#f4f6fb] lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]"
      data-native-splash-anchor="auth"
    >
      <AuthShowcase mode={mode} />

      <div className="relative flex min-h-dvh flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(99,102,241,0.08),transparent_60%)] lg:hidden" />

        <div className="relative flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-10 xl:px-14">
          <div className="mx-auto w-full max-w-[420px]">
            <BrowserShellHint />
            <Link
              href="/"
              className="mb-8 flex w-fit items-center gap-2.5 font-black text-foreground lg:hidden"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                K
              </span>
              Kiosk POS
            </Link>

            <div
              className="mb-8 flex rounded-2xl border bg-white/80 p-1 shadow-sm backdrop-blur-sm"
              role="tablist"
              aria-label="Authentication mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                onClick={() => switchMode("signin")}
                className={cn(
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                  mode === "signin"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "create"}
                onClick={() => switchMode("create")}
                className={cn(
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                  mode === "create"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Create account
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
              <div className="border-b bg-gradient-to-b from-slate-50 to-white px-6 pb-5 pt-6 sm:px-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                  <Image
                    src="/icons/icon-192.png"
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-lg"
                  />
                </div>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {mode === "signin" ? "Welcome back" : "Start selling today"}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
                  {mode === "signin"
                    ? "Sign in to checkout, stock, and reports."
                    : "One profile — then set up your organization."}
                </p>
              </div>

              <div className="px-6 py-6 sm:px-8">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl border-slate-200 bg-white text-[15px] font-semibold shadow-sm hover:bg-slate-50"
                  type="button"
                  disabled={busy}
                  onClick={handleGoogle}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                  )}
                  Continue with Google
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      or use email
                    </span>
                  </div>
                </div>

                {mode === "signin" ? (
                  <Form {...signInForm}>
                    <form
                      onSubmit={signInForm.handleSubmit(handleSignIn)}
                      className="space-y-4"
                    >
                      <FormField
                        control={signInForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="signin-email">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  id="signin-email"
                                  autoComplete="email"
                                  className="h-12 rounded-xl pl-10"
                                  placeholder="name@store.com"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signInForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel htmlFor="signin-password">Password</FormLabel>
                              <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Forgot?
                              </Link>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  id="signin-password"
                                  autoComplete="current-password"
                                  className="h-12 rounded-xl pr-11"
                                  type={showPassword ? "text" : "password"}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  onClick={() => setShowPassword((v) => !v)}
                                  aria-label={
                                    showPassword ? "Hide password" : "Show password"
                                  }
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        className="h-12 w-full rounded-xl text-base font-black"
                        type="submit"
                        disabled={busy}
                        data-testid="auth-submit-signin"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign in
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...createForm}>
                    <form
                      onSubmit={createForm.handleSubmit(handleCreate)}
                      className="space-y-4"
                    >
                      <FormField
                        control={createForm.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="create-name">Full name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  id="create-name"
                                  autoComplete="name"
                                  className="h-12 rounded-xl pl-10"
                                  placeholder="Jane Doe"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="create-email">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  id="create-email"
                                  autoComplete="email"
                                  className="h-12 rounded-xl pl-10"
                                  placeholder="name@store.com"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="create-password">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  id="create-password"
                                  autoComplete="new-password"
                                  className="h-12 rounded-xl pr-11"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="At least 8 characters"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  onClick={() => setShowPassword((v) => !v)}
                                  aria-label={
                                    showPassword ? "Hide password" : "Show password"
                                  }
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="create-confirm-password">
                              Confirm password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  id="create-confirm-password"
                                  autoComplete="new-password"
                                  className="h-12 rounded-xl pr-11"
                                  type={showConfirm ? "text" : "password"}
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  onClick={() => setShowConfirm((v) => !v)}
                                  aria-label={
                                    showConfirm
                                      ? "Hide confirm password"
                                      : "Show confirm password"
                                  }
                                >
                                  {showConfirm ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        className="h-12 w-full rounded-xl text-base font-black"
                        type="submit"
                        disabled={busy}
                        data-testid="auth-submit-create"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Create account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}

                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
                  <div className="flex items-start gap-2.5">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      {mode === "signin"
                        ? "Your workspace, roles, and register session load after sign-in."
                        : "We email a verification link — no card required to start."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              {" · "}
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              {" · "}
              <Link href="/" className="hover:text-foreground">
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPageFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6fb] px-4">
      <div className="flex items-center gap-3 rounded-2xl border bg-white px-6 py-4 shadow-lg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground">
          Preparing secure sign-in...
        </p>
      </div>
    </div>
  );
}

export function AuthPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthPageContent />
    </Suspense>
  );
}
