"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCog, ShieldCheck, Users as UsersIcon, CircleCheck, UserPlus, Pencil, Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard-shell";
import { UserFormDialog } from "@/components/user-form-dialog";
import { useCurrentUser } from "@/lib/use-current-user";
import { api, type PortalUser } from "@/lib/api";

type Summary = { total: number; admins: number; collectors: number; active: number };

export default function AdminUsers() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useCurrentUser();
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  const toggleActive = async (u: PortalUser) => {
    setError("");
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      reload();
    } catch (e: any) {
      setError(e?.message || "Could not update that account");
    }
  };

  // Collectors have no business here; the API refuses them anyway.
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login");
    else if (!isAdmin) router.push("/capture");
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true); setError("");
    Promise.all([
      api.users(role ? { role } : {}),
      api.userSummary(),
    ])
      .then(([u, s]) => { setUsers(u); setSummary(s); })
      .catch((e) => setError(e?.message || "Could not load users"))
      .finally(() => setLoading(false));
  }, [isAdmin, role, reloadKey]);

  if (!isAdmin) {
    return (
      <DashboardShell title="Users">
        <p className="md-body-medium text-md-on-surface-variant">
          {authLoading ? "Checking your access…" : "Administrators only."}
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Users"
      actions={
        <>
          <span className="md-label-large text-md-on-surface-variant tabular-nums">
            {loading ? "Loading…" : `${users.length} shown`}
          </span>
          <Button
            variant="filled"
            size="sm"
            onClick={() => { setEditing(null); setDialogOpen(true); }}
          >
            <UserPlus className="size-4" /> Add user
          </Button>
        </>
      }
    >
      <UserFormDialog
        open={dialogOpen}
        user={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={reload}
      />

      {/* ---------------- Summary ---------------- */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile icon={<UsersIcon className="size-4" />} label="Total accounts" value={summary.total} />
          <Tile icon={<ShieldCheck className="size-4" />} label="Administrators" value={summary.admins} />
          <Tile icon={<UserCog className="size-4" />} label="Collectors" value={summary.collectors} />
          <Tile icon={<CircleCheck className="size-4" />} label="Active" value={summary.active} />
        </div>
      )}

      {/* ---------------- Filters ---------------- */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Chip selected={role === ""} onClick={() => setRole("")}>All roles</Chip>
        <Chip selected={role === "admin"} onClick={() => setRole("admin")}>Administrators</Chip>
        <Chip selected={role === "collector"} onClick={() => setRole("collector")}>Collectors</Chip>
      </div>

      {error && (
        <div className="md-body-medium mt-4 rounded-xl bg-md-error-container px-4 py-3 text-md-on-error-container">
          {error}
        </div>
      )}

      {/* ---------------- Table ---------------- */}
      <div className="md-card mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-md-surface-variant text-left">
              {["User", "Role", "Agents captured", "Status", "Last sign-in", ""].map((h, i) => (
                <th key={i} className="md-label-medium p-4 font-medium text-md-on-surface-variant">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="md-body-medium p-10 text-center text-md-on-surface-variant">
                  {loading ? "Loading…" : "No users match."}
                </td>
              </tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t border-md-surface-variant transition-colors hover:bg-md-surface-variant/35">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-md-primary-container md-label-large text-md-on-primary-container uppercase">
                      {u.username.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="md-body-medium font-medium">{u.username}</p>
                      {(u.full_name || u.email) && (
                        <p className="md-label-medium truncate text-md-on-surface-variant">
                          {u.full_name || u.email}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`md-label-medium rounded px-2 py-1 ${
                    u.role === "admin"
                      ? "bg-md-primary-container text-md-on-primary-container"
                      : "bg-md-surface-variant text-md-on-surface-variant"
                  }`}>
                    {u.role === "admin" ? "Administrator" : "Collector"}
                  </span>
                </td>
                <td className="md-body-medium p-4 tabular-nums">{u.agents_captured.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`md-label-medium ${u.is_active ? "text-md-primary" : "text-md-on-surface-variant"}`}>
                    {u.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="md-body-medium p-4 text-md-on-surface-variant">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="text" size="icon-sm"
                      onClick={() => { setEditing(u); setDialogOpen(true); }}
                      aria-label={`Edit ${u.username}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="text" size="icon-sm"
                      disabled={u.id === user?.id}
                      title={u.id === user?.id
                        ? "You cannot deactivate your own account"
                        : u.is_active ? "Deactivate" : "Reactivate"}
                      onClick={() => toggleActive(u)}
                      aria-label={`${u.is_active ? "Deactivate" : "Reactivate"} ${u.username}`}
                    >
                      <Power className={`size-4 ${u.is_active ? "text-md-error" : "text-md-primary"}`} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="md-label-medium mt-4 text-md-on-surface-variant">
        Deactivating keeps an account&rsquo;s captured agents intact — prefer it to deletion,
        which is blocked for anyone who has captured records.
      </p>
    </DashboardShell>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="md-card p-4">
      <p className="md-label-medium flex items-center gap-1.5 text-md-on-surface-variant">
        {icon} {label}
      </p>
      <p className="md-headline-medium mt-1 tabular-nums">{value.toLocaleString()}</p>
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
      className={`md-label-large rounded border px-4 py-2 transition-colors ${
        selected
          ? "border-md-primary bg-md-primary-container text-md-on-primary-container"
          : "border-md-outline text-md-on-surface-variant hover:bg-md-surface-variant"
      }`}
    >
      {children}
    </button>
  );
}
