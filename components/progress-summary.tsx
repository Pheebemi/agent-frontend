"use client";

import { CheckCircle2 } from "lucide-react";
import type { Dash } from "@/lib/use-dashboard";

/**
 * Captured-agents counter + progress bar.
 * `full` is the landing-page hero block; `compact` is the dashboard strip.
 */
export function ProgressSummary({
  d,
  loading,
  variant = "full",
}: {
  d: Dash | null;
  loading?: boolean;
  variant?: "full" | "compact";
}) {
  if (!d) {
    return (
      <div className="md-card p-6">
        <p className="md-body-medium text-md-on-surface-variant">
          {loading ? "Loading progress…" : "Could not load progress."}
        </p>
      </div>
    );
  }

  const bar = (
    <div className="h-3 w-full overflow-hidden rounded-full bg-md-surface-variant">
      <div
        className="h-full rounded-full bg-md-primary transition-all duration-500"
        style={{ width: `${Math.min(d.percent, 100)}%` }}
      />
    </div>
  );

  if (variant === "compact") {
    return (
      <div className="md-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="md-label-medium text-md-on-surface-variant">Agents captured</p>
            <p className="md-headline-medium mt-1 tabular-nums">
              {d.captured.toLocaleString()}
              <span className="md-title-medium text-md-on-surface-variant">
                {" "}/ {d.target.toLocaleString()}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="md-headline-medium font-medium text-md-primary tabular-nums">{d.percent}%</p>
            <p className="md-label-medium text-md-on-surface-variant tabular-nums">
              {d.pus_complete.toLocaleString()}/{d.total_polling_units.toLocaleString()} PUs done
            </p>
          </div>
        </div>
        <div className="mt-4">{bar}</div>
      </div>
    );
  }

  return (
    <div className="md-card p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="md-label-large text-md-on-surface-variant">Agents captured</p>
          <p className="md-display-medium mt-2 tabular-nums">
            {d.captured.toLocaleString()}
            <span className="md-headline-medium text-md-on-surface-variant">
              {" "}/ {d.target.toLocaleString()}
            </span>
          </p>
        </div>
        <p className="md-display-large font-medium text-md-primary tabular-nums">{d.percent}%</p>
      </div>

      <div className="mt-6">{bar}</div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Polling units" value={d.total_polling_units.toLocaleString()} />
        <Stat label="PUs complete" value={d.pus_complete.toLocaleString()} icon />
        <Stat label="Agents per PU" value={String(d.max_per_pu)} />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="rounded-xl bg-md-surface-variant/45 px-4 py-3">
      <p className="md-label-medium text-md-on-surface-variant">{label}</p>
      <p className="md-title-large mt-1 flex items-center gap-1.5 tabular-nums">
        {icon && <CheckCircle2 className="size-4 text-md-primary" />}
        {value}
      </p>
    </div>
  );
}
