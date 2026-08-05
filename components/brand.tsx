"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

/** The logo file in agent-frontend/public/. */
export const LOGO_SRC = "/icon.png";

/**
 * The APC mark.
 *
 * Falls back to the shield icon if the file is missing, so the header never
 * renders as a broken image while the logo is still being added.
 */
export function BrandMark({
  size = "size-10",
  onPrimary = false,
}: {
  size?: string;
  onPrimary?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl ${size} ${
          onPrimary ? "bg-white text-md-primary" : "bg-md-primary text-md-on-primary"
        }`}
      >
        <ShieldCheck className="size-1/2" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="APC"
      onError={() => setFailed(true)}
      // A white tile keeps a full-colour logo legible on the indigo panel.
      className={`shrink-0 rounded-xl object-contain ${size} ${
        onPrimary ? "bg-white p-1" : ""
      }`}
    />
  );
}

/** Mark plus wordmark — the standard header/sidebar lockup. */
export function BrandLock({
  size = "size-10",
  onPrimary = false,
  subtitle = "Agent Portal",
}: {
  size?: string;
  onPrimary?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark size={size} onPrimary={onPrimary} />
      <div>
        <p className={`md-label-medium ${onPrimary ? "text-white/80" : "text-md-primary"}`}>
          APC TARABA
        </p>
        <p className={`md-title-medium ${onPrimary ? "text-white" : ""}`}>{subtitle}</p>
      </div>
    </div>
  );
}
