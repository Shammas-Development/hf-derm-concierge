"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HFHeader } from "@/components/branding/HFHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await loginAction(formData);
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-1 flex-col bg-[#F5F7FA]">
      <HFHeader />
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <form
          action={onSubmit}
          className="w-full max-w-sm rounded-2xl border border-border bg-white p-7 shadow-sm"
        >
          <div className="mx-auto h-11 w-11 rounded-xl bg-[#EEF2FB] text-[#003DA5] flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-center font-heading text-xl font-semibold text-[#002C75]">
            Operator Dashboard
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Enter the demo password to continue.
          </p>
          <div className="mt-6 space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              className="h-11"
              placeholder="••••••"
            />
          </div>
          {error && (
            <div className="mt-3 text-sm text-[#EF4444]">{error}</div>
          )}
          <Button
            type="submit"
            disabled={pending}
            className="mt-5 w-full h-11 bg-[#003DA5] hover:bg-[#002C75]"
          >
            {pending ? "Verifying…" : "Sign in"}
          </Button>
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Demo password is <code className="bg-[#F5F7FA] px-1 rounded">HF2026</code>
          </p>
        </form>
      </main>
    </div>
  );
}
