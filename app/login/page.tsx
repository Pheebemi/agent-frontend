"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.login(username, password);
      router.push("/capture");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ---------------- Brand panel ---------------- */}
      <div className="relative hidden flex-col justify-between bg-md-primary p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/15">
            <ShieldCheck className="size-6" />
          </div>
          <span className="md-title-large font-medium">APC Taraba</span>
        </div>

        <div>
          <h1 className="md-display-medium max-w-md">
            Every polling unit, fully staffed.
          </h1>
          <p className="md-body-large mt-5 max-w-sm text-white/75">
            Register party agents across all 16 LGAs and 3,597 polling units in Taraba State.
          </p>
        </div>

        <div className="flex gap-8">
          <div>
            <p className="md-headline-medium font-medium tabular-nums">3,597</p>
            <p className="md-label-medium text-white/70">Polling units</p>
          </div>
          <div>
            <p className="md-headline-medium font-medium tabular-nums">35,970</p>
            <p className="md-label-medium text-white/70">Agents to capture</p>
          </div>
        </div>
      </div>

      {/* ---------------- Form panel ---------------- */}
      <div className="flex items-center justify-center bg-md-surface px-4 py-12 sm:px-8">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-md-primary text-md-on-primary">
              <ShieldCheck className="size-5" />
            </div>
            <span className="md-title-medium">APC Taraba</span>
          </div>

          <h2 className="md-headline-large">Collector sign in</h2>
          <p className="md-body-medium mt-2 text-md-on-surface-variant">
            Use the account issued by your LGA coordinator.
          </p>

          {error && (
            <div className="md-body-medium mt-6 rounded-xl bg-md-error-container px-4 py-3 text-md-on-error-container">
              {error}
            </div>
          )}

          <label htmlFor="username" className="md-label-large mt-7 block text-md-on-surface-variant">
            Username
          </label>
          <input
            id="username"
            className="md-field mt-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />

          <label htmlFor="password" className="md-label-large mt-5 block text-md-on-surface-variant">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="md-field pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-md-on-surface-variant transition-colors hover:text-md-primary"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          <Button type="submit" variant="filled" size="lg" disabled={busy} className="mt-8 w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <p className="md-body-medium mt-6 text-center text-md-on-surface-variant">
            Trouble signing in? Contact your LGA coordinator.
          </p>
        </form>
      </div>
    </div>
  );
}
