"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScanLine, Save, CheckCircle2, Loader2, User, Pencil, Trash2, Check, X, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard-shell";
import { ImageInput } from "@/components/image-input";
import { RowPhoto } from "@/components/row-photo";
import { ProgressSummary } from "@/components/progress-summary";
import { useDashboard } from "@/lib/use-dashboard";
import { api, type Lga, type Ward, type PollingUnit, type Agent, type ReviewRow } from "@/lib/api";

type Row = {
  full_name: string; phone_number: string;
  passport_photo: string | null; passport_photo_url?: string;
  ai_confidence: string; needs_review: boolean;
};

const blankRow = (): Row => ({ full_name: "", phone_number: "", passport_photo: null, ai_confidence: "", needs_review: false });

export default function Capture() {
  const router = useRouter();
  const { d, loading: dashLoading, reload: reloadDash } = useDashboard();
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [pus, setPus] = useState<PollingUnit[]>([]);
  const [lgaId, setLgaId] = useState<number | null>(null);
  const [wardId, setWardId] = useState<number | null>(null);
  const [pu, setPu] = useState<PollingUnit | null>(null);
  const [existing, setExisting] = useState<Agent[]>([]);

  const [rows, setRows] = useState<Row[]>([]);
  const [source, setSource] = useState<"manual" | "scan">("manual");
  const [sheet, setSheet] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);

  // Inline editing of an already-saved agent.
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPhotoPath, setEditPhotoPath] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>();
  const [rowBusy, setRowBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (!api.isLoggedIn()) router.push("/login"); }, []);
  useEffect(() => { api.lgas().then(setLgas).catch(() => {}); }, []);

  const remaining = pu ? Math.max(0, 10 - existing.length) : 0;

  // Cascade handlers
  const onLga = async (id: number) => {
    setLgaId(id); setWardId(null); setWards([]); setPus([]); setPu(null); setRows([]);
    setWards(await api.wards(id));
  };
  const onWard = async (id: number) => {
    setWardId(id); setPus([]); setPu(null); setRows([]);
    setPus(await api.pollingUnits(id));
  };
  const onPu = async (id: number) => {
    const chosen = pus.find((p) => p.id === id) || (await api.pollingUnit(id));
    setPu(chosen);
    const res = await api.agentsForPu(id);
    const list = Array.isArray(res) ? res : res.results;
    setExisting(list);
    // Start with a single row — more are added on demand. A batch scan still
    // fills every remaining slot at once.
    const rem = Math.max(0, 10 - list.length);
    setRows(rem > 0 ? [blankRow()] : []);
    setSource("manual"); setSheet(null); setMsg(""); setError("");
  };

  const runScan = async () => {
    if (!pu) return;
    setScanning(true); setError(""); setMsg("");
    try {
      const res = await api.scan(pu.pu_code, sheet);
      // take only as many rows as remaining slots, keep non-empty first
      const mapped: Row[] = res.rows.slice(0, remaining).map((r: ReviewRow) => ({
        full_name: r.full_name, phone_number: r.phone_number,
        passport_photo: r.passport_photo, passport_photo_url: r.passport_photo_url,
        ai_confidence: r.ai_confidence, needs_review: r.needs_review,
      }));
      setRows(mapped.length ? mapped : Array.from({ length: remaining }, blankRow));
      setSource(res.ai_used ? "scan" : "manual");
      // Anything the backend actually failed at is shown as an error, not a
      // success notice — a silent fallback to blank rows reads like a no-op.
      if (res.errors?.length) setError(res.message); else setMsg(res.message);
    } catch (err: any) { setError(err?.message || "Scan failed"); }
    finally { setScanning(false); }
  };

  /** Refetch the saved list only, keeping any rows already typed in below. */
  const refreshExisting = async (id: number) => {
    const res = await api.agentsForPu(id);
    const list = Array.isArray(res) ? res : res.results;
    setExisting(list);
    const rem = Math.max(0, 10 - list.length);
    setRows((prev) => {
      const kept = prev.slice(0, rem);
      if (!kept.length && rem > 0) kept.push(blankRow());
      return kept;
    });
  };

  const addRow = () =>
    setRows((prev) => (prev.length < remaining ? [...prev, blankRow()] : prev));
  const removeRow = (i: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  // ---- editing an already-saved agent ----
  const startEdit = (a: Agent) => {
    setEditId(a.id);
    setEditName(a.full_name);
    setEditPhone(a.phone_number);
    setEditPhotoPath("");
    setEditPhotoUrl(a.passport_photo_url ?? undefined);
    setError(""); setMsg("");
  };
  const cancelEdit = () => {
    setEditId(null); setEditPhotoPath(""); setEditPhotoUrl(undefined);
  };
  const saveEdit = async (id: number) => {
    setRowBusy(true); setError("");
    try {
      const patch: Record<string, string> = {
        full_name: editName.trim(),
        phone_number: editPhone.trim(),
      };
      // Only send the photo when it actually changed.
      if (editPhotoPath) patch.passport_photo_path = editPhotoPath;
      await api.updateAgent(id, patch);
      cancelEdit();
      if (pu) await refreshExisting(pu.id);
      setMsg("Agent updated.");
    } catch (e: any) {
      setError(e?.message || "Could not update this agent");
    } finally { setRowBusy(false); }
  };
  const removeAgent = async (a: Agent) => {
    if (!confirm(`Delete ${a.full_name}? This cannot be undone.`)) return;
    setRowBusy(true); setError("");
    try {
      await api.deleteAgent(a.id);
      if (pu) await refreshExisting(pu.id);
      reloadDash();
      setMsg(`Deleted ${a.full_name}.`);
    } catch (e: any) {
      setError(e?.message || "Could not delete this agent");
    } finally { setRowBusy(false); }
  };

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const filledCount = useMemo(() => rows.filter((r) => r.full_name.trim()).length, [rows]);

  const save = async () => {
    if (!pu) return;
    setSaving(true); setError(""); setMsg("");
    try {
      const payload = rows
        .filter((r) => r.full_name.trim())
        .map((r) => ({
          full_name: r.full_name.trim(), phone_number: r.phone_number.trim(),
          passport_photo: r.passport_photo || undefined,
          ai_confidence: r.ai_confidence, needs_review: r.needs_review,
        }));
      if (!payload.length) { setError("Nothing to save — enter at least one name."); setSaving(false); return; }
      const res = await api.bulkCreate(pu.id, source, payload);
      setMsg(`Saved ${res.created} agents. ${res.polling_unit.agent_count}/10 for this PU.`);
      // refresh existing + reset the slots
      await onPu(pu.id);
      reloadDash(); // keep the counter at the top of the page in step
    } catch (err: any) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell title="Capture agents">
      <div className="mx-auto max-w-3xl">
        {/* ---------------- Counter + progress ---------------- */}
        <ProgressSummary d={d} loading={dashLoading} variant="compact" />

        {/* ---------------- Cascade ---------------- */}
        <section className="mt-6">
          <p className="md-label-large text-md-on-surface-variant">Select a polling unit</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              aria-label="LGA"
              className="md-field appearance-none"
              value={lgaId ?? ""}
              onChange={(e) => onLga(Number(e.target.value))}
            >
              <option value="" disabled>Select LGA</option>
              {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select
              aria-label="Ward"
              className="md-field appearance-none"
              value={wardId ?? ""}
              disabled={!wards.length}
              onChange={(e) => onWard(Number(e.target.value))}
            >
              <option value="" disabled>Select Ward</option>
              {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select
              aria-label="Polling unit"
              className="md-field appearance-none"
              value={pu?.id ?? ""}
              disabled={!pus.length}
              onChange={(e) => onPu(Number(e.target.value))}
            >
              <option value="" disabled>Select Polling Unit</option>
              {pus.map((p) => <option key={p.id} value={p.id}>{p.name} {p.is_complete ? "✓" : `(${p.agent_count}/10)`}</option>)}
            </select>
          </div>
        </section>

        {pu && (
          <>
            {/* ---------------- PU summary ---------------- */}
            <div className="md-card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="md-title-medium">{pu.name}</p>
                <p className="md-body-medium mt-0.5 text-md-on-surface-variant">
                  {pu.pu_code} · {existing.length}/10 captured · {remaining} slots left
                </p>
              </div>
              {pu.is_complete ? (
                <span className="md-label-large flex items-center gap-1.5 rounded bg-md-primary-container px-3 py-1.5 text-md-on-primary-container">
                  <CheckCircle2 className="size-4" /> Complete
                </span>
              ) : (
                <span className="md-label-large rounded border border-md-outline px-3 py-1.5 text-md-on-surface-variant tabular-nums">
                  {existing.length}/10
                </span>
              )}
            </div>

            {/* ---------------- Already captured ---------------- */}
            {existing.length > 0 && (
              <section className="mt-6">
                <div className="flex items-baseline justify-between">
                  <h2 className="md-title-medium">Already captured</h2>
                  <span className="md-label-medium text-md-on-surface-variant tabular-nums">
                    {existing.length} of 10
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {existing.map((a, i) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl border border-md-surface-variant bg-md-surface-variant/35 p-3"
                    >
                      <span className="md-label-medium w-5 shrink-0 text-center text-md-on-surface-variant tabular-nums">
                        {i + 1}
                      </span>

                      {editId === a.id ? (
                        <>
                          <RowPhoto
                            puCode={pu.pu_code}
                            url={editPhotoUrl}
                            disabled={rowBusy}
                            onError={setError}
                            onChange={({ path, url }) => {
                              setEditPhotoPath(path ?? "");
                              setEditPhotoUrl(url);
                            }}
                          />
                          <input
                            aria-label="Edit full name"
                            className="md-field min-w-0 flex-1 px-3 py-2 text-sm"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <input
                            aria-label="Edit phone number"
                            className="md-field w-32 shrink-0 px-3 py-2 text-sm"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                          />
                          <Button variant="filled" size="icon-sm" disabled={rowBusy || !editName.trim()}
                                  onClick={() => saveEdit(a.id)} aria-label="Save changes">
                            {rowBusy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                          </Button>
                          <Button variant="text" size="icon-sm" disabled={rowBusy}
                                  onClick={cancelEdit} aria-label="Cancel editing">
                            <X className="size-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {a.passport_photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.passport_photo_url} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-md-surface text-md-on-surface-variant">
                              <User className="size-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="md-body-medium truncate font-medium">{a.full_name}</p>
                            <p className="md-label-medium truncate text-md-on-surface-variant tabular-nums">
                              {a.phone_number || "No phone recorded"}
                            </p>
                          </div>
                          <span className="md-label-medium shrink-0 rounded bg-md-surface px-2 py-1 text-md-on-surface-variant">
                            {a.source === "scan" ? "Scan" : "Manual"}
                          </span>
                          <Button variant="text" size="icon-sm" disabled={rowBusy}
                                  onClick={() => startEdit(a)} aria-label={`Edit ${a.full_name}`}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="text" size="icon-sm" disabled={rowBusy}
                                  onClick={() => removeAgent(a)} aria-label={`Delete ${a.full_name}`}>
                            <Trash2 className="size-4 text-md-error" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {remaining === 0 ? (
              <p className="md-body-large mt-10 text-center text-md-on-surface-variant">
                This polling unit already has all 10 agents.
              </p>
            ) : (
              <>
                {/* ---------------- Batch scan ---------------- */}
                <section className="mt-4 rounded-xl border border-dashed border-md-outline p-5">
                  <p className="md-title-medium flex items-center gap-2">
                    <ScanLine className="size-5 text-md-primary" /> Batch scan
                    <span className="md-label-medium rounded bg-md-surface-variant px-2 py-0.5 text-md-on-surface-variant">
                      Optional
                    </span>
                  </p>
                  <p className="md-body-medium mt-1.5 text-md-on-surface-variant">
                    Snap the sheets with your camera (or upload them) and AI fills in the rows
                    below for you to check. Prefer to type instead? Skip this and fill the rows
                    in directly.
                  </p>
                  <div className="mt-4">
                    <ImageInput
                      label="Polling unit sheet"
                      hint="One photo of the whole sheet — names, phone numbers and passport photos together"
                      file={sheet}
                      onChange={setSheet}
                      disabled={scanning}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button variant="tonal" size="sm" disabled={scanning || !sheet} onClick={runScan}>
                      {scanning ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
                      {scanning ? "Extracting…" : "Run AI extraction"}
                    </Button>
                    <span className="md-label-medium text-md-on-surface-variant">
                      {sheet ? "Sheet ready" : "Snap or upload the sheet to enable extraction"}
                    </span>
                  </div>
                </section>

                {msg && (
                  <div className="md-body-medium mt-4 rounded-xl bg-md-primary-container px-4 py-3 text-md-on-primary-container">
                    {msg}
                  </div>
                )}
                {error && (
                  <div className="md-body-medium mt-4 rounded-xl bg-md-error-container px-4 py-3 text-md-on-error-container">
                    {error}
                  </div>
                )}

                {/* ---------------- Review grid ---------------- */}
                <section className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <h2 className="md-title-medium">
                      {source === "scan" ? "Review & edit" : "New agents"}
                    </h2>
                    <span className="md-label-medium text-md-on-surface-variant tabular-nums">
                      {filledCount} ready · {remaining} slot{remaining === 1 ? "" : "s"} left
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {rows.map((r, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-xl border bg-md-surface p-3 transition-colors ${
                          r.needs_review ? "border-md-error" : "border-md-surface-variant"
                        }`}
                      >
                        <span className="md-label-medium w-5 shrink-0 text-center text-md-on-surface-variant tabular-nums">
                          {existing.length + i + 1}
                        </span>
                        <RowPhoto
                          puCode={pu.pu_code}
                          url={r.passport_photo_url}
                          disabled={saving}
                          onError={setError}
                          onChange={({ path, url }) =>
                            setRow(i, { passport_photo: path, passport_photo_url: url })
                          }
                        />
                        <input
                          placeholder="Full name"
                          aria-label={`Full name, row ${i + 1}`}
                          className="md-field min-w-0 flex-1 px-3 py-2 text-sm"
                          value={r.full_name}
                          onChange={(e) => setRow(i, { full_name: e.target.value })}
                        />
                        <input
                          placeholder="Phone"
                          aria-label={`Phone number, row ${i + 1}`}
                          className="md-field w-36 shrink-0 px-3 py-2 text-sm"
                          value={r.phone_number}
                          onChange={(e) => setRow(i, { phone_number: e.target.value })}
                        />
                        {r.needs_review && (
                          <span className="md-label-medium shrink-0 rounded bg-md-error-container px-2 py-1 text-md-on-error-container">
                            review
                          </span>
                        )}
                        {rows.length > 1 && (
                          <Button
                            variant="text"
                            size="icon-sm"
                            disabled={saving}
                            onClick={() => removeRow(i)}
                            aria-label={`Remove row ${i + 1}`}
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outlined"
                    size="sm"
                    className="mt-3"
                    disabled={saving || rows.length >= remaining}
                    onClick={addRow}
                  >
                    <Plus className="size-4" />
                    {rows.length >= remaining ? "All slots in use" : "Add another agent"}
                  </Button>
                </section>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="md-label-medium text-md-on-surface-variant">
                    Source: {source === "scan" ? "Batch scan" : "Manual entry"}
                  </span>
                  <Button variant="filled" size="lg" disabled={saving || !filledCount} onClick={save}>
                    {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                    {saving ? "Saving…" : `Save ${filledCount} agent${filledCount === 1 ? "" : "s"}`}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
