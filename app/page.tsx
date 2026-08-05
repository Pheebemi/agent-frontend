"use client";

import Link from "next/link";
import { Users, ClipboardList, RefreshCw, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLock } from "@/components/brand";
import { CaptureIllustration } from "@/components/illustrations/capture-illustration";
import { ProgressSummary } from "@/components/progress-summary";
import { TarabaMap } from "@/components/taraba-map";
import { useDashboard } from "@/lib/use-dashboard";

export default function Landing() {
  const { d, loading, reload } = useDashboard();

  return (
    <div className="min-h-screen bg-md-surface text-md-on-surface">
      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-10 border-b border-md-surface-variant bg-md-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <BrandLock />
          <div className="flex items-center gap-2">
            <Button variant="text" size="sm" onClick={reload} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outlined" size="sm" asChild>
              <Link href="/agents"><Search className="size-4" /> Find an agent</Link>
            </Button>
            <Button variant="filled" size="sm" asChild>
              <Link href="/capture"><ClipboardList className="size-4" /> Capture agents</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ---------------- Hero ---------------- */}
        <section className="grid grid-cols-1 items-center gap-8 py-6 lg:grid-cols-2 lg:gap-12">
          <div>
            <span className="md-label-medium inline-flex items-center gap-1.5 rounded bg-md-primary-container px-3 py-1.5 text-md-on-primary-container">
              <MapPin className="size-3.5" /> 16 LGAs · Taraba State
            </span>
            <h1 className="md-display-medium mt-5 text-md-on-surface">
              Every polling unit,<br />
              <span className="text-md-primary">fully staffed.</span>
            </h1>
            <p className="md-body-large mt-4 max-w-md text-md-on-surface-variant">
              The APC Agent Portal an initiative of Dr. Agbu Kefas bringing party agent
              registration across Taraba State into one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="filled" size="lg" asChild>
                <Link href="/capture"><ClipboardList className="size-5" /> Start capturing</Link>
              </Button>
              <Button variant="outlined" size="lg" asChild>
                <Link href="/admin"><Users className="size-5" /> Open admin</Link>
              </Button>
            </div>
          </div>

          <CaptureIllustration className="w-full max-w-lg justify-self-center lg:justify-self-end" />
        </section>

        {/* ---------------- Counter + progress ---------------- */}
        <section className="mt-6">
          <ProgressSummary d={d} loading={loading} variant="full" />
        </section>

        {/* ---------------- Coverage map ---------------- */}
        {d && (
          <section className="mt-10">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="md-headline-medium">Coverage map</h2>
              <span className="md-label-medium text-md-on-surface-variant">
                Hover an LGA for its distribution
              </span>
            </div>
            <div className="md-card p-4 sm:p-6">
              <TarabaMap byLga={d.by_lga} />
            </div>
          </section>
        )}

        {/* ---------------- Per-LGA ---------------- */}
        {d && (
          <>
            <div className="mt-10 mb-4 flex items-baseline justify-between">
              <h2 className="md-headline-medium">Progress by LGA</h2>
              <span className="md-label-medium text-md-on-surface-variant">
                {d.by_lga.length} local government areas
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {d.by_lga.map((l) => (
                <div key={l.lga} className="md-card p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <p className="md-title-medium">{l.lga}</p>
                    <span className="md-label-medium shrink-0 rounded bg-md-primary-container px-2 py-1 text-md-on-primary-container tabular-nums">
                      {l.percent}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-md-surface-variant">
                    <div
                      className="h-full rounded-full bg-md-primary transition-all duration-500"
                      style={{ width: `${Math.min(l.percent, 100)}%` }}
                    />
                  </div>
                  <p className="md-body-medium mt-3 text-md-on-surface-variant tabular-nums">
                    {l.agents.toLocaleString()} / {l.target.toLocaleString()} agents
                  </p>
                  <p className="md-label-medium mt-1 text-md-on-surface-variant tabular-nums">
                    {l.pus_complete}/{l.polling_units} PUs done
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
