"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export type Dash = Awaited<ReturnType<typeof api.dashboard>>;

/** Shared loader for the public progress figures (landing + both dashboards). */
export function useDashboard() {
  const [d, setD] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setD(await api.dashboard()); } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { d, loading, reload: load };
}
