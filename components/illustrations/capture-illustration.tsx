/**
 * Flat vector illustration in the unDraw style (single accent + neutral ramp).
 * The accent is driven by --md-primary, so it follows the theme automatically.
 */
export function CaptureIllustration({ className }: { className?: string }) {
  const accent = "var(--md-primary)";
  const container = "var(--md-primary-container)";

  return (
    <svg
      viewBox="0 0 800 520"
      role="img"
      aria-label="A field collector recording party agents onto a polling unit sheet"
      className={className}
    >
      {/* ground */}
      <ellipse cx="400" cy="472" rx="318" ry="20" fill="#e6e6e6" opacity="0.55" />

      {/* back panel */}
      <rect x="112" y="52" width="330" height="60" rx="14" fill={container} opacity="0.55" />

      {/* ---------- agent sheet ---------- */}
      <rect x="96" y="96" width="322" height="330" rx="16" fill="#ffffff" stroke="#e6e6e6" strokeWidth="2" />
      <rect x="217" y="82" width="80" height="26" rx="9" fill={accent} />
      <rect x="240" y="70" width="34" height="18" rx="6" fill="#3f3d56" />

      {/* sheet header */}
      <rect x="128" y="132" width="132" height="12" rx="6" fill="#3f3d56" />
      <rect x="128" y="154" width="86" height="9" rx="4.5" fill="#e6e6e6" />

      {/* sheet rows: photo chip + name line + phone line */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 186 + i * 46;
        return (
          <g key={i}>
            <rect x="128" y={y} width="36" height="36" rx="8" fill={container} />
            <circle cx="146" cy={y + 13} r="7" fill={accent} opacity="0.55" />
            <path d={`M134 ${y + 31} a12 12 0 0 1 24 0 z`} fill={accent} opacity="0.55" />
            <rect x="176" y={y + 7} width="124" height="9" rx="4.5" fill="#e6e6e6" />
            <rect x="176" y={y + 22} width="78" height="8" rx="4" fill="#f2f2f2" />
            {i < 3 && (
              <circle cx="330" cy={y + 18} r="9" fill={accent} />
            )}
            {i < 3 && (
              <path
                d={`M326 ${y + 18} l3 3.4 l6 -7`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {i >= 3 && <circle cx="330" cy={y + 18} r="9" fill="#f2f2f2" />}
          </g>
        );
      })}

      {/* ---------- floating progress card ---------- */}
      <rect x="452" y="300" width="238" height="118" rx="16" fill="#ffffff" stroke="#e6e6e6" strokeWidth="2" />
      <rect x="476" y="326" width="96" height="10" rx="5" fill="#3f3d56" />
      <rect x="476" y="350" width="190" height="14" rx="7" fill="#f2f2f2" />
      <rect x="476" y="350" width="128" height="14" rx="7" fill={accent} />
      <rect x="476" y="380" width="64" height="8" rx="4" fill="#e6e6e6" />
      <rect x="552" y="380" width="42" height="8" rx="4" fill="#e6e6e6" />

      {/* ---------- person ---------- */}
      {/* back leg */}
      <path d="M556 300 l14 96 l-6 44 h26 l10 -46 l-6 -94 z" fill="#2f2e41" />
      {/* front leg */}
      <path d="M600 300 l18 92 l16 40 l24 -10 l-20 -38 l-8 -84 z" fill="#3f3d56" />
      {/* shoes */}
      <rect x="548" y="434" width="46" height="16" rx="8" fill="#2f2e41" />
      <rect x="628" y="418" width="46" height="16" rx="8" transform="rotate(-22 628 418)" fill="#2f2e41" />

      {/* torso */}
      <path d="M552 196 h72 a20 20 0 0 1 20 20 l-6 92 h-96 l-8 -92 a20 20 0 0 1 18 -20 z" fill={accent} />
      {/* collar */}
      <path d="M578 196 l12 20 l14 -20 z" fill="#ffffff" opacity="0.85" />

      {/* arm reaching to the sheet */}
      <path
        d="M556 216 c-30 14 -60 34 -78 58"
        fill="none"
        stroke={accent}
        strokeWidth="22"
        strokeLinecap="round"
      />
      <circle cx="472" cy="282" r="13" fill="#ffb8b8" />

      {/* other arm */}
      <path d="M640 220 c22 20 30 46 26 70" fill="none" stroke={accent} strokeWidth="22" strokeLinecap="round" />
      <circle cx="664" cy="300" r="13" fill="#ffb8b8" />

      {/* neck + head */}
      <rect x="578" y="164" width="28" height="42" rx="14" fill="#ffb8b8" />
      <circle cx="592" cy="146" r="34" fill="#ffb8b8" />
      {/* hair */}
      <path d="M558 134 a34 34 0 0 1 68 -6 c-14 6 -30 -6 -44 4 c-8 6 -18 2 -24 2 z" fill="#2f2e41" />

      {/* ---------- decorative dots ---------- */}
      <circle cx="708" cy="150" r="8" fill={container} />
      <circle cx="736" cy="196" r="5" fill={container} />
      <circle cx="694" cy="216" r="4" fill={container} />
      <circle cx="72" cy="330" r="7" fill={container} />
      <circle cx="52" cy="382" r="4" fill={container} />
    </svg>
  );
}
