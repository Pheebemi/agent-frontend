const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8010/api";
const TOKEN_KEY = "agent_token";

export type Lga = { id: number; name: string; code: string };
export type Ward = { id: number; name: string; code: string; lga: number };
export type PollingUnit = {
  id: number; name: string; pu_code: string; ward: number;
  agent_count: number; is_complete: boolean;
};
export type Agent = {
  id: number; polling_unit: number; polling_unit_code: string;
  full_name: string; phone_number: string; passport_photo_url: string | null;
  source: string; captured_by_username: string | null;
  ai_confidence: string; needs_review: boolean; date_captured: string;
};
export type Paginated<T> = {
  count: number; next: string | null; previous: string | null; results: T[];
};
export type PortalUser = {
  id: number; username: string; full_name: string; email: string;
  role: "admin" | "collector"; is_active: boolean;
  date_joined: string; last_login: string | null; agents_captured: number;
};
export type ReviewRow = {
  row: number; full_name: string; phone_number: string;
  passport_photo: string | null; passport_photo_url?: string;
  ai_confidence: string; needs_review: boolean;
};

class ApiClient {
  private base: string;
  constructor(base: string) { this.base = base; }

  getToken() { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); }
  setToken(t: string) { localStorage.setItem(TOKEN_KEY, t); }
  clearToken() { localStorage.removeItem(TOKEN_KEY); }
  isLoggedIn() { return !!this.getToken(); }

  private async req<T>(path: string, opts: RequestInit = {}, isForm = false): Promise<T> {
    const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
    if (!isForm) headers["Content-Type"] = "application/json";
    const token = this.getToken();
    if (token) headers["Authorization"] = `Token ${token}`;
    const res = await fetch(`${this.base}${path}`, { ...opts, headers });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || e.non_field_errors?.[0] || JSON.stringify(e) || `HTTP ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : res.json();
  }

  async login(username: string, password: string) {
    const d = await this.req<{ token: string; user: any }>("/auth/login/", {
      method: "POST", body: JSON.stringify({ username, password }),
    });
    this.setToken(d.token);
    return d;
  }
  me() { return this.req<{ id: number; username: string; is_staff: boolean }>("/auth/me/"); }

  dashboard() {
    return this.req<{
      captured: number; target: number; percent: number;
      total_polling_units: number; pus_complete: number; max_per_pu: number;
      by_lga: Array<{ lga: string; polling_units: number; agents: number; target: number; percent: number; pus_complete: number }>;
    }>("/dashboard/");
  }

  lgas() { return this.req<Lga[]>("/lgas/"); }
  wards(lgaId: number) { return this.req<Ward[]>(`/wards/?lga=${lgaId}`); }
  pollingUnits(wardId: number) { return this.req<PollingUnit[]>(`/polling-units/?ward=${wardId}`); }
  pollingUnit(id: number) { return this.req<PollingUnit>(`/polling-units/${id}/`); }
  agentsForPu(puId: number) {
    return this.req<{ results: Agent[]; count: number } | Agent[]>(`/agents/?polling_unit=${puId}`);
  }

  /** `sheet` is the single document holding names, phones and photos.
   *  `photos` is only needed when the photos live on a separate image. */
  scan(puCode: string, sheet: File | null, photos: File | null = null) {
    const fd = new FormData();
    fd.append("pu_code", puCode);
    if (sheet) fd.append("sheet_image", sheet);
    if (photos) fd.append("photos_image", photos);
    return this.req<{
      ai_used: boolean; ai_available: boolean;
      errors: string[]; rows: ReviewRow[]; message: string;
    }>("/scan/", { method: "POST", body: fd }, true);
  }

  bulkCreate(puId: number, source: string, agents: Array<Partial<ReviewRow>>) {
    return this.req<{ created: number; polling_unit: PollingUnit; agents: Agent[] }>(
      "/agents/bulk_create/",
      { method: "POST", body: JSON.stringify({ polling_unit_id: puId, source, agents }) }
    );
  }

  updateAgent(
    id: number,
    data: Partial<{ full_name: string; phone_number: string; passport_photo_path: string }>
  ) {
    return this.req<Agent>(`/agents/${id}/`, { method: "PATCH", body: JSON.stringify(data) });
  }
  deleteAgent(id: number) {
    return this.req<void>(`/agents/${id}/`, { method: "DELETE" });
  }

  /** Upload one passport photo; returns the media path bulkCreate expects. */
  uploadPhoto(puCode: string, photo: File) {
    const fd = new FormData();
    fd.append("pu_code", puCode);
    fd.append("photo", photo);
    return this.req<{ path: string; url: string }>(
      "/upload-photo/", { method: "POST", body: fd }, true
    );
  }

  /** Public agent search — no token required. */
  searchAgents(params: Record<string, string>) {
    const q = new URLSearchParams(params).toString();
    return this.req<Paginated<Agent>>(`/agents/${q ? `?${q}` : ""}`);
  }

  users(params: Record<string, string> = {}) {
    const q = new URLSearchParams(params).toString();
    return this.req<PortalUser[]>(`/users/${q ? `?${q}` : ""}`);
  }
  userSummary() {
    return this.req<{ total: number; admins: number; collectors: number; active: number }>(
      "/users/summary/"
    );
  }

  adminAgents(params: Record<string, string>) {
    const q = new URLSearchParams(params).toString();
    return this.req<{ results: Agent[]; count: number } | Agent[]>(`/agents/?${q}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
