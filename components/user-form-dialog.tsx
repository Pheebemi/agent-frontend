"use client";

import { useEffect, useState } from "react";
import { X, Loader2, UserPlus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type PortalUser, type NewUser } from "@/lib/api";

/** Create a portal account, or edit an existing one. */
export function UserFormDialog({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user?: PortalUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!user;
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"collector" | "admin">("collector");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username ?? "");
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "collector");
    setPassword("");
    setError("");
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const payload: NewUser = {
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        role,
      };
      // On edit, an empty password means "leave it alone".
      if (password) payload.password = password;

      if (editing) await api.updateUser(user!.id, payload);
      else await api.createUser(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not save this account");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-md-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-md-surface-variant px-5 py-4">
          <p className="md-title-large">{editing ? `Edit ${user!.username}` : "Add a user"}</p>
          <Button type="button" variant="text" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {error && (
            <div className="md-body-medium rounded-xl bg-md-error-container px-4 py-3 text-md-on-error-container">
              {error}
            </div>
          )}

          <Field label="Username" hint="Used to sign in — no spaces">
            <input
              className="md-field" required autoFocus value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input className="md-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Last name">
              <input className="md-field" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>

          <Field label="Email" hint="Optional">
            <input type="email" className="md-field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          <Field label="Role">
            <div className="grid grid-cols-2 gap-2">
              <RoleOption
                selected={role === "collector"}
                onClick={() => setRole("collector")}
                title="Collector"
                desc="Captures agents"
              />
              <RoleOption
                selected={role === "admin"}
                onClick={() => setRole("admin")}
                title="Administrator"
                desc="Full access"
              />
            </div>
          </Field>

          <Field
            label={editing ? "New password" : "Password"}
            hint={editing ? "Leave blank to keep the current password" : "At least 8 characters"}
          >
            <input
              type="password"
              className="md-field"
              required={!editing}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-md-surface-variant px-5 py-4">
          <Button type="button" variant="text" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="filled" disabled={busy || !username.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" />
                  : editing ? <KeyRound className="size-4" /> : <UserPlus className="size-4" />}
            {busy ? "Saving…" : editing ? "Save changes" : "Create account"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="md-label-large text-md-on-surface">{label}</span>
      {hint && <span className="md-label-medium ml-2 text-md-on-surface-variant">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function RoleOption({ selected, onClick, title, desc }: {
  selected: boolean; onClick: () => void; title: string; desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-md-primary bg-md-primary-container text-md-on-primary-container"
          : "border-md-outline text-md-on-surface-variant hover:bg-md-surface-variant"
      }`}
    >
      <span className="md-label-large block">{title}</span>
      <span className="md-label-medium block opacity-80">{desc}</span>
    </button>
  );
}
