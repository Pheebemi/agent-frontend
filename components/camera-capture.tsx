"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Live camera modal.
 *
 * getUserMedia is the only way to open a real camera on desktop — the `capture`
 * attribute on a file input is a mobile-only hint that desktop browsers ignore.
 * But getUserMedia needs a *secure context*: https, or localhost. Opened over a
 * LAN address like http://192.168.1.5:3000 the API simply isn't there, so we
 * fall back to the device camera app via a capture input.
 */
export function CameraCapture({
  open,
  onClose,
  onCapture,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) { stop(); return; }

    let cancelled = false;
    setError(""); setReady(false);

    (async () => {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setError(
          `The camera needs a secure connection. You're on ${window.location.origin}. ` +
          `Use http://localhost:3000 on this machine, or serve the site over https to ` +
          `use the camera from a phone. You can still pick a photo below.`
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser can't open a camera directly. Use the option below.");
        return;
      }

      // Prefer a high resolution (these are documents), but never fail over it.
      const attempts: MediaStreamConstraints[] = [
        { video: { facingMode: facing, width: { ideal: 2560 }, height: { ideal: 1440 } }, audio: false },
        { video: { facingMode: facing }, audio: false },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let last: any = null;
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (e: any) {
          last = e;
          // Permission and missing-hardware failures won't improve on retry.
          if (e?.name === "NotAllowedError" || e?.name === "NotFoundError") break;
        }
      }

      if (cancelled) { stream?.getTracks().forEach((t) => t.stop()); return; }

      if (!stream) {
        const name = last?.name || "";
        setError(
          name === "NotAllowedError"
            ? "Camera permission was blocked. Allow camera access for this site in your browser's address-bar icon, then try again."
            : name === "NotFoundError"
            ? "No camera was found on this device."
            : name === "NotReadableError"
            ? "The camera is already in use by another app. Close it and try again."
            : `Could not start the camera${name ? ` (${name})` : ""}: ${last?.message || "unknown error"}`
        );
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { /* autoplay guard */ }
      }
      setReady(true);
    })();

    return () => { cancelled = true; stop(); };
  }, [open, facing, stop]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
      onClose();
    }, "image/jpeg", 0.92);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-md-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-md-surface-variant px-4 py-3">
          <p className="md-title-medium">Take a photo</p>
          <Button variant="text" size="icon-sm" onClick={onClose} aria-label="Close camera">
            <X className="size-5" />
          </Button>
        </div>

        {/* Always present: the device camera app / file picker fallback. */}
        <input
          ref={nativeRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) { onCapture(f); onClose(); }
          }}
        />

        <div className="relative flex aspect-video items-center justify-center bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`size-full object-contain ${ready ? "" : "invisible"}`}
          />
          {!ready && !error && (
            <p className="md-body-medium absolute text-white/70">Starting camera…</p>
          )}
          {error && (
            <div className="absolute max-w-md px-6 text-center">
              <p className="md-body-medium text-white/90">{error}</p>
              <Button variant="tonal" size="sm" className="mt-4" onClick={() => nativeRef.current?.click()}>
                <FolderOpen className="size-4" /> Use camera app or pick a file
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Button
            variant="text"
            size="sm"
            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
            disabled={!ready}
          >
            <RefreshCw className="size-4" /> Switch camera
          </Button>
          <Button variant="filled" onClick={shoot} disabled={!ready}>
            <Camera className="size-5" /> Capture
          </Button>
        </div>
      </div>
    </div>
  );
}
