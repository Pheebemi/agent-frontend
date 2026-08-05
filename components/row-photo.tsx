"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Loader2, X, User } from "lucide-react";
import { CameraCapture } from "@/components/camera-capture";
import { api } from "@/lib/api";

/**
 * Passport photo slot for one capture row.
 *
 * Uploads immediately and hands back the media path, so a manually-typed row
 * carries a photo the same way a scanned row does — bulkCreate takes a path
 * string either way.
 */
export function RowPhoto({
  puCode,
  url,
  onChange,
  onError,
  disabled,
}: {
  puCode: string;
  url?: string;
  onChange: (v: { path: string | null; url?: string }) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [cam, setCam] = useState(false);
  const [busy, setBusy] = useState(false);

  // Dismiss the little menu on any outside click.
  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const r = await api.uploadPhoto(puCode, file);
      onChange({ path: r.path, url: r.url });
    } catch (e: any) {
      onError?.(e?.message || "Photo upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) upload(f);
        }}
      />

      <CameraCapture open={cam} onClose={() => setCam(false)} onCapture={upload} />

      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setMenu((m) => !m)}
        aria-label={url ? "Change passport photo" : "Add passport photo"}
        className="group relative flex size-12 items-center justify-center overflow-hidden rounded-lg border border-md-outline-variant bg-md-surface-variant text-md-on-surface-variant transition-colors hover:border-md-primary disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <User className="size-5" />
        )}
      </button>

      {url && !busy && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ path: null, url: undefined })}
          aria-label="Remove passport photo"
          className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-md-error text-md-on-error shadow-sm"
        >
          <X className="size-3" />
        </button>
      )}

      {menu && !busy && (
        <div className="absolute left-0 top-14 z-20 w-40 overflow-hidden rounded-xl border border-md-outline-variant bg-md-surface shadow-xl">
          <button
            type="button"
            onClick={() => { setMenu(false); setCam(true); }}
            className="md-label-large flex w-full items-center gap-2 px-3 py-2.5 text-left text-md-on-surface hover:bg-md-surface-variant"
          >
            <Camera className="size-4" /> Take photo
          </button>
          <button
            type="button"
            onClick={() => { setMenu(false); fileRef.current?.click(); }}
            className="md-label-large flex w-full items-center gap-2 px-3 py-2.5 text-left text-md-on-surface hover:bg-md-surface-variant"
          >
            <Upload className="size-4" /> Upload
          </button>
        </div>
      )}
    </div>
  );
}
