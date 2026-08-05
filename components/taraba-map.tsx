"use client";

import { useRef, useState } from "react";
import { TARABA_LGAS, MAP_WIDTH, MAP_HEIGHT, normalizeLga } from "@/lib/taraba-map";

export type LgaDatum = {
  lga: string;
  polling_units: number;
  agents: number;
  target: number;
  percent: number;
  pus_complete: number;
};

type Props = { byLga: LgaDatum[] };

/**
 * Interactive Taraba choropleth. Each LGA is shaded by its agent-capture
 * completion (%). Hovering an LGA shows its distribution in a floating tooltip.
 */
export function TarabaMap({ byLga }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ d: LgaDatum; x: number; y: number } | null>(null);

  // name -> datum, keyed by the same normalization the map paths use
  const data = new Map<string, LgaDatum>();
  for (const row of byLga) data.set(normalizeLga(row.lga), row);

  const move = (e: React.MouseEvent, d: LgaDatum) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ d, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Taraba State agent-capture coverage map"
      >
        {TARABA_LGAS.map((shape) => {
          const d = data.get(shape.key);
          const pct = d ? d.percent : 0;
          // Faint (unstarted) -> solid primary (complete)
          const opacity = 0.1 + 0.9 * Math.min(pct, 100) / 100;
          const active = hover?.d && normalizeLga(hover.d.lga) === shape.key;
          return (
            <path
              key={shape.key}
              d={shape.d}
              fill="var(--md-primary)"
              fillOpacity={opacity}
              stroke={active ? "var(--md-primary)" : "var(--md-surface)"}
              strokeWidth={active ? 3 : 1.5}
              className="cursor-pointer transition-[stroke-width]"
              onMouseEnter={(e) => d && move(e, d)}
              onMouseMove={(e) => d && move(e, d)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
        {/* LGA labels */}
        {TARABA_LGAS.map((s) => (
          <text
            key={`t-${s.key}`}
            x={s.cx}
            y={s.cy}
            textAnchor="middle"
            className="pointer-events-none fill-md-on-surface"
            style={{ fontSize: 15, fontWeight: 500, opacity: 0.7 }}
          >
            {s.name}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2">
        <span className="md-label-medium text-md-on-surface-variant">0%</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{ background: "linear-gradient(to right, color-mix(in srgb, var(--md-primary) 10%, transparent), var(--md-primary))" }}
        />
        <span className="md-label-medium text-md-on-surface-variant">100% captured</span>
      </div>

      {/* Tooltip */}
      {hover && (
        <div
          className="md-card pointer-events-none absolute z-20 w-52 p-3 shadow-lg"
          style={{
            left: Math.min(hover.x + 14, (wrapRef.current?.clientWidth ?? 0) - 220),
            top: Math.max(hover.y - 10, 0),
          }}
        >
          <p className="md-title-small font-medium">{hover.d.lga}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-md-surface-variant">
            <div className="h-full rounded-full bg-md-primary" style={{ width: `${Math.min(hover.d.percent, 100)}%` }} />
          </div>
          <p className="md-body-small mt-2 text-md-on-surface-variant tabular-nums">
            {hover.d.agents.toLocaleString()} / {hover.d.target.toLocaleString()} agents · {hover.d.percent}%
          </p>
          <p className="md-label-medium mt-0.5 text-md-on-surface-variant tabular-nums">
            {hover.d.pus_complete}/{hover.d.polling_units} PUs complete
          </p>
        </div>
      )}
    </div>
  );
}
