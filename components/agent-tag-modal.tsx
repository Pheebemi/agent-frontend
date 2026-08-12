"use client";

import { useEffect, useState } from "react";
import { Printer, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentTag } from "@/components/agent-tag";
import { api, type Agent } from "@/lib/api";

type LocationInfo = { lgaName: string; wardName: string; puName: string; puCode: string };

/** CSS injected only while the tag is open, so it never touches printing elsewhere in the app. */
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden; }
  #agent-print-tag, #agent-print-tag * { visibility: visible; }
  #agent-print-tag {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  @page { size: 90mm 140mm; margin: 0; }
}
`;

/** Frontend-only print preview for a single agent's ID tag. No PDF, no A4 — just window.print(). */
export function AgentTagModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  const [info, setInfo] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agent) return;
    const style = document.createElement("style");
    style.textContent = PRINT_STYLE;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [agent]);

  useEffect(() => {
    if (!agent) { setInfo(null); return; }
    let cancelled = false;
    setLoading(true);
    setInfo(null);
    (async () => {
      // Fall back gracefully — the tag still prints with whatever we know.
      let lgaName = "";
      let wardName = "";
      let puName = agent.polling_unit_code;
      let puCode = agent.polling_unit_code;
      try {
        const pu = await api.pollingUnit(agent.polling_unit);
        puName = pu.name;
        puCode = pu.pu_code;
        try {
          const ward = await api.ward(pu.ward);
          wardName = ward.name;
          try {
            const lga = await api.lga(ward.lga);
            lgaName = lga.name;
          } catch {}
        } catch {}
      } catch {}
      if (!cancelled) {
        setInfo({ lgaName, wardName, puName, puCode });
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [agent]);

  useEffect(() => {
    if (!agent) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [agent, onClose]);

  if (!agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-sm flex-col items-center gap-4 overflow-y-auto rounded-2xl bg-md-surface p-6 shadow-xl">
        <div className="flex w-full items-center justify-between">
          <p className="md-title-medium">Agent tag preview</p>
          <Button variant="text" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>

        {loading || !info ? (
          <div className="flex h-[140mm] w-[90mm] max-w-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-md-on-surface-variant" />
          </div>
        ) : (
          <AgentTag
            agent={agent}
            lgaName={info.lgaName}
            wardName={info.wardName}
            puName={info.puName}
            puCode={info.puCode}
          />
        )}

        <div className="flex w-full gap-2">
          <Button variant="outlined" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button variant="filled" className="flex-1" disabled={loading} onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </div>
    </div>
  );
}
