"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/camera-capture";

/**
 * One sheet image, captured either way:
 *  - "Take photo" opens a live camera view via getUserMedia, so it works on
 *    desktop as well as on a phone in the field.
 *  - "Upload" is the file-picker fallback.
 */
export function ImageInput({
  label,
  hint,
  file,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  file: File | null;
  onChange: (f: File | null) => void;
  disabled?: boolean;
}) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files?.[0] ?? null);
    // Reset so re-picking the same file still fires a change event.
    e.target.value = "";
  };

  return (
    <div className="rounded-xl border border-md-outline-variant p-3">
      <p className="md-label-large text-md-on-surface">{label}</p>
      {hint && <p className="md-label-medium mt-0.5 text-md-on-surface-variant">{hint}</p>}

      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={pick} />

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={onChange}
      />

      {file ? (
        <div className="mt-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="" className="size-14 shrink-0 rounded-lg object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="md-body-medium truncate">{file.name}</p>
            <p className="md-label-medium text-md-on-surface-variant">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <Button
            variant="text"
            size="icon-sm"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label={`Remove ${label}`}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="tonal"
            size="sm"
            onClick={() => setCameraOpen(true)}
            disabled={disabled}
          >
            <Camera className="size-4" /> Take photo
          </Button>
          <Button
            variant="outlined"
            size="sm"
            onClick={() => uploadRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="size-4" /> Upload
          </Button>
        </div>
      )}
    </div>
  );
}
