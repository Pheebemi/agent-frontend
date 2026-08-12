"use client";

import { User } from "lucide-react";
import { BrandMark } from "@/components/brand";
import type { Agent } from "@/lib/api";

/**
 * Printable agent ID tag — true-size at 90mm x 140mm so the on-screen
 * preview matches the printed card 1:1 (see AgentTagModal for the print
 * wiring). Deliberately not A4: this is a badge, not a document.
 */
export function AgentTag({
  agent,
  lgaName,
  wardName,
  puName,
  puCode,
}: {
  agent: Agent;
  lgaName: string;
  wardName: string;
  puName: string;
  puCode: string;
}) {
  return (
    <div
      id="agent-print-tag"
      style={{
        width: "90mm",
        height: "140mm",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
      className="relative flex shrink-0 flex-col overflow-hidden rounded-2xl border border-md-outline-variant bg-white text-md-on-surface shadow-lg print:rounded-none print:border-0 print:shadow-none"
    >
      {/* Faint watermark for an ID-card feel */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.05]">
        <BrandMark size="size-56" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        {/* Header band */}
        <div className="flex items-center gap-2.5 bg-md-primary px-4 py-3 text-white">
          <BrandMark size="size-9" onPrimary />
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] font-semibold tracking-[0.15em] opacity-85">APC TARABA</p>
            <p className="text-sm font-bold tracking-wide">AGENT TAG</p>
          </div>
        </div>

        {/* Photo + identity */}
        <div className="flex flex-col items-center px-4 pt-4">
          <div className="-mt-4 size-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-md-surface-variant shadow ring-1 ring-md-outline-variant">
            {agent.passport_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agent.passport_photo_url} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-md-on-surface-variant">
                <User className="size-10" />
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-base leading-tight font-bold break-words">
            {agent.full_name}
          </p>
          <p className="mt-0.5 text-center text-xs tabular-nums text-md-on-surface-variant">
            {agent.phone_number || "No phone recorded"}
          </p>
        </div>

        <div className="mx-4 mt-4 border-t border-dashed border-md-outline-variant" />

        {/* Location details */}
        <div className="flex flex-1 flex-col justify-center gap-3 px-5">
          <InfoRow label="LGA" value={lgaName} />
          <InfoRow label="Ward" value={wardName} />
          <InfoRow label="Polling unit" value={puName} />
        </div>

        {/* Footer */}
        <div className="bg-md-surface-variant/60 px-4 py-2.5 text-center">
          <p className="font-mono text-xs tracking-wider">{puCode}</p>
          <p className="mt-0.5 text-[9px] text-md-on-surface-variant">
            Agent #{agent.id} · APC Taraba Agent Portal
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-[10px] font-medium tracking-wide text-md-on-surface-variant uppercase">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-right text-sm font-medium">{value || "—"}</span>
    </div>
  );
}
