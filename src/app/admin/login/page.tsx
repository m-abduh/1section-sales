"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      router.replace("/admin");
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-surface-muted px-4">
      <div className="cinema-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="cinema-spotlight pointer-events-none absolute inset-0" />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/5 dark:shadow-black/40">
          <div className="border-b border-border bg-surface-muted/60 px-8 py-6">
            <div className="flex items-center gap-3">
              <div>
                <Logo className="h-5 w-[82px] text-fg" />
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
                  Admin console
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-7">
            <h1 className="text-2xl font-extrabold tracking-tight text-fg">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              Manage niches, products, and orders.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <Field label="Email" error={errors.email?.message}>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@1section.com"
                  {...register("email")}
                />
              </Field>

              <Field label="Password" error={errors.password?.message}>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                />
              </Field>

              {serverError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {serverError}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : null}
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-fg-muted">
          1section · Practical learning for real-world problems
        </p>
      </div>
    </div>
  );
}
