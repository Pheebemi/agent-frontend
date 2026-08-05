"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

export type CurrentUser = { id: number; username: string; is_staff: boolean };

/** Who is signed in, and are they an admin. `null` once we know nobody is. */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!api.isLoggedIn()) { setLoading(false); return; }
    api.me()
      .then((u) => { if (!cancelled) setUser(u); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { user, loading, isAdmin: !!user?.is_staff };
}
