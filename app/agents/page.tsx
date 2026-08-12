"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, User, X, ChevronLeft, ChevronRight, ImageIcon, Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLock } from "@/components/brand";
import { AgentTagModal } from "@/components/agent-tag-modal";
import { api, type Lga, type Ward, type PollingUnit, type Agent } from "@/lib/api";

const PAGE_SIZE = 50; // matches REST_FRAMEWORK PAGE_SIZE

export default function PublicAgents() {
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [pus, setPus] = useState<PollingUnit[]>([]);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [lgaId, setLgaId] = useState("");
  const [wardId, setWardId] = useState("");
  const [puId, setPuId] = useState("");
  const [source, setSource] = useState("");
  const [photoOnly, setPhotoOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tagAgent, setTagAgent] = useState<Agent | null>(null);

  useEffect(() => { api.lgas().then(setLgas).catch(() => {}); }, []);

  // Debounce typing so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const onLga = async (id: string) => {
    setLgaId(id); setWardId(""); setPuId(""); setWards([]); setPus([]); setPage(1);
    if (id) setWards(await api.wards(Number(id)).catch(() => []));
  };
  const onWard = async (id: string) => {
    setWardId(id); setPuId(""); setPus([]); setPage(1);
    if (id) setPus(await api.pollingUnits(Number(id)).catch(() => []));
  };

  useEffect(() => {
    setLoading(true); setError("");
    const params: Record<string, string> = { page: String(page) };
    if (debounced) params.search = debounced;
    if (lgaId) params.lga = lgaId;
    if (wardId) params.ward = wardId;
    if (puId) params.polling_unit = puId;
    if (source) params.source = source;
    if (photoOnly) params.has_photo = "1";

    api.searchAgents(params)
      .then((r) => { setAgents(r.results); setCount(r.count); })
      .catch((e) => { setError(e?.message || "Could not load agents"); setAgents([]); setCount(0); })
      .finally(() => setLoading(false));
  }, [debounced, lgaId, wardId, puId, source, photoOnly, page]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const hasFilters = !!(search || lgaId || wardId || puId || source || photoOnly);

  const clearAll = () => {
    setSearch(""); setDebounced(""); setLgaId(""); setWardId(""); setPuId("");
    setSource(""); setPhotoOnly(false); setWards([]); setPus([]); setPage(1);
  };

  const lgaName = useMemo(
    () => lgas.find((l) => String(l.id) === lgaId)?.name ?? "",
    [lgas, lgaId]
  );

  return (
    <div className="min-h-screen bg-md-surface text-md-on-surface">
      {/* ---------------- Public header ---------------- */}
      <header className="sticky top-0 z-10 border-b border-md-surface-variant bg-md-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/"><BrandLock /></Link>
          <Button variant="outlined" size="sm" asChild>
            <Link href="/">Dashboard</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="md-headline-large">Registered agents</h1>
        <p className="md-body-large mt-2 max-w-xl text-md-on-surface-variant">
          Search every agent captured so far by name, phone number, polling unit or ward.
        </p>

        {/* ---------------- Search ---------------- */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-md-on-surface-variant" />
          <input
            className="md-field pl-12 pr-12"
            placeholder="Search name, phone, polling unit or ward…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search agents"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-0 top-0 flex h-full w-12 items-center justify-center rounded-r-xl text-md-on-surface-variant hover:text-md-primary"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* ---------------- Filters ---------------- */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by LGA"
            className="md-field w-auto py-2.5 text-sm"
            value={lgaId}
            onChange={(e) => onLga(e.target.value)}
          >
            <option value="">All LGAs</option>
            {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          <select
            aria-label="Filter by ward"
            className="md-field w-auto py-2.5 text-sm"
            value={wardId}
            disabled={!wards.length}
            onChange={(e) => onWard(e.target.value)}
          >
            <option value="">{wards.length ? "All wards" : "Select an LGA first"}</option>
            {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>

          <select
            aria-label="Filter by polling unit"
            className="md-field w-auto py-2.5 text-sm"
            value={puId}
            disabled={!pus.length}
            onChange={(e) => { setPuId(e.target.value); setPage(1); }}
          >
            <option value="">{pus.length ? "All polling units" : "Select a ward first"}</option>
            {pus.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <Chip selected={source === ""} onClick={() => { setSource(""); setPage(1); }}>All sources</Chip>
          <Chip selected={source === "scan"} onClick={() => { setSource("scan"); setPage(1); }}>Scanned</Chip>
          <Chip selected={source === "manual"} onClick={() => { setSource("manual"); setPage(1); }}>Manual</Chip>
          <Chip selected={photoOnly} onClick={() => { setPhotoOnly(!photoOnly); setPage(1); }}>
            <ImageIcon className="size-3.5" /> With photo
          </Chip>

          {hasFilters && (
            <Button variant="text" size="sm" onClick={clearAll}>
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>

        {/* ---------------- Results ---------------- */}
        <div className="mt-6 flex items-baseline justify-between">
          <p className="md-label-large text-md-on-surface-variant tabular-nums">
            {loading ? "Searching…" : `${count.toLocaleString()} agent${count === 1 ? "" : "s"}`}
            {lgaName && !loading && ` in ${lgaName}`}
          </p>
          {totalPages > 1 && (
            <p className="md-label-medium text-md-on-surface-variant tabular-nums">
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        {error && (
          <div className="md-body-medium mt-4 rounded-xl bg-md-error-container px-4 py-3 text-md-on-error-container">
            {error}
          </div>
        )}

        {!loading && !error && agents.length === 0 ? (
          <div className="md-card mt-4 p-12 text-center">
            <p className="md-title-medium">No agents found</p>
            <p className="md-body-medium mt-1 text-md-on-surface-variant">
              {hasFilters ? "Try widening your search or clearing the filters." : "No agents have been captured yet."}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <div key={a.id} className="md-card flex items-center gap-4 p-4">
                {a.passport_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.passport_photo_url}
                    alt=""
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-md-surface-variant text-md-on-surface-variant">
                    <User className="size-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="md-title-medium truncate">{a.full_name}</p>
                  <p className="md-body-medium truncate text-md-on-surface-variant tabular-nums">
                    {a.phone_number || "No phone recorded"}
                  </p>
                  <p className="md-label-medium mt-1 truncate text-md-on-surface-variant tabular-nums">
                    {a.polling_unit_code}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 self-start">
                  <span className="md-label-medium rounded bg-md-surface-variant px-2 py-1 text-md-on-surface-variant">
                    {a.source === "scan" ? "Scan" : "Manual"}
                  </span>
                  <Button
                    variant="text"
                    size="icon-sm"
                    onClick={() => setTagAgent(a)}
                    aria-label={`Print tag for ${a.full_name}`}
                  >
                    <Printer className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- Pagination ---------------- */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outlined"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <span className="md-label-large text-md-on-surface-variant tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outlined"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <AgentTagModal agent={tagAgent} onClose={() => setTagAgent(null)} />
    </div>
  );
}

function Chip({ selected, onClick, children }: {
  selected: boolean; onClick: () => void; children: React.ReactNode;
}) {
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
