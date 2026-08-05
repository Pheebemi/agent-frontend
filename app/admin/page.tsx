"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProgressSummary } from "@/components/progress-summary";
import { useDashboard } from "@/lib/use-dashboard";
import { useCurrentUser } from "@/lib/use-current-user";
import { api, type Lga, type Agent } from "@/lib/api";

const PAGE_SIZE = 50; // matches REST_FRAMEWORK PAGE_SIZE

export default function Admin() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useCurrentUser();
  const { d, loading: dashLoading } = useDashboard();

  // Collectors get their own dashboard; hiding the nav link isn't enough.
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login");
    else if (!isAdmin) router.push("/capture");
  }, [authLoading, user, isAdmin, router]);
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [lgaId, setLgaId] = useState("");
  const [source, setSource] = useState("");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.lgas().then(setLgas).catch(() => {}); }, []);

  // Any filter change invalidates the current page — otherwise you can land
  // on page 4 of a one-page result and see nothing.
  useEffect(() => { setPage(1); }, [lgaId, source, reviewOnly]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page) };
    if (lgaId) params.lga = lgaId;
    if (source) params.source = source;
    if (reviewOnly) params.needs_review = "1";
    api.searchAgents(params)
      .then((r) => { setAgents(r.results); setCount(r.count); })
      .catch(() => { setAgents([]); setCount(0); })
      .finally(() => setLoading(false));
  }, [lgaId, source, reviewOnly, page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <DashboardShell
      title="Agents — Admin"
      actions={
        <span className="md-label-large text-md-on-surface-variant tabular-nums">
          {loading ? "Loading…" : `${count.toLocaleString()} agents`}
        </span>
      }
    >
      <div>
        {/* ---------------- Counter + progress ---------------- */}
        <ProgressSummary d={d} loading={dashLoading} variant="compact" />

        {/* ---------------- Filters ---------------- */}
        <section className="mt-6 flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by LGA"
            className="md-field w-auto appearance-none py-2.5 text-sm"
            value={lgaId}
            onChange={(e) => setLgaId(e.target.value)}
          >
            <option value="">All LGAs</option>
            {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          <Chip selected={source === ""} onClick={() => setSource("")}>All sources</Chip>
          <Chip selected={source === "scan"} onClick={() => setSource("scan")}>Batch scan</Chip>
          <Chip selected={source === "manual"} onClick={() => setSource("manual")}>Manual</Chip>

          <Chip selected={reviewOnly} onClick={() => setReviewOnly(!reviewOnly)}>
            <AlertTriangle className="size-3.5" /> Review queue
          </Chip>
        </section>

        {/* ---------------- Table ---------------- */}
        <div className="md-card mt-5 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-md-surface-variant text-left">
                {["Photo", "Name", "Phone", "Polling Unit", "Source", "By", "Flag"].map((h) => (
                  <th key={h} className="md-label-medium p-4 font-medium text-md-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="md-body-medium p-10 text-center text-md-on-surface-variant">
                    No agents match.
                  </td>
                </tr>
              ) : agents.map((a) => (
                <tr key={a.id} className="border-t border-md-surface-variant transition-colors hover:bg-md-surface-variant/35">
                  <td className="p-4">
                    {a.passport_photo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={a.passport_photo_url} alt="" className="size-10 rounded-lg object-cover" />
                      : <div className="flex size-10 items-center justify-center rounded-lg bg-md-surface-variant text-md-on-surface-variant"><User className="size-4" /></div>}
                  </td>
                  <td className="md-body-medium p-4 font-medium">{a.full_name}</td>
                  <td className="md-body-medium p-4 text-md-on-surface-variant tabular-nums">{a.phone_number || "—"}</td>
                  <td className="md-body-medium p-4 text-md-on-surface-variant tabular-nums">{a.polling_unit_code}</td>
                  <td className="p-4">
                    <span className="md-label-medium rounded bg-md-surface-variant px-2 py-1 text-md-on-surface-variant">
                      {a.source === "scan" ? "Scan" : "Manual"}
                    </span>
                  </td>
                  <td className="md-body-medium p-4 text-md-on-surface-variant">{a.captured_by_username || "—"}</td>
                  <td className="p-4">
                    {a.needs_review && (
                      <span className="md-label-medium rounded bg-md-error-container px-2 py-1 text-md-on-error-container">
                        review
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---------------- Pagination ---------------- */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="md-label-medium text-md-on-surface-variant tabular-nums">
              Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–
              {Math.min(page * PAGE_SIZE, count).toLocaleString()} of {count.toLocaleString()}
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outlined" size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <span className="md-label-large text-md-on-surface-variant tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outlined" size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

/** MD3 filter chip. */
function Chip({
  selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`md-label-large inline-flex items-center gap-1.5 rounded border px-4 py-2 transition-colors ${
        selected
          ? "border-md-primary bg-md-primary-container text-md-on-primary-container"
          : "border-md-outline text-md-on-surface-variant hover:bg-md-surface-variant"
      }`}
    >
      {children}
    </button>
  );
}
