import React from "react";
import type { LucideIcon } from "lucide-react";

/* ── MetricCard ─────────────────────────────────────────────────── */
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  subLabel?: string;
}

export function MetricCard({ label, value, icon: Icon, accent = "var(--accent)", subLabel }: MetricCardProps) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* left accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: accent,
          borderRadius: "10px 0 0 10px",
        }}
      />
      {/* icon */}
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "8px",
          background: `${accent}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      {/* text */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px" }}>{label}</div>
        {subLabel && (
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{subLabel}</div>
        )}
      </div>
    </div>
  );
}

/* ── MetricCardSkeleton ────────────────────────────────────────── */
export function MetricCardSkeleton() {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "16px 18px",
        display: "flex",
        gap: "14px",
        alignItems: "center",
      }}
    >
      <div className="skeleton" style={{ width: "38px", height: "38px", borderRadius: "8px", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: "20px", width: "55%" }} />
        <div className="skeleton" style={{ height: "11px", width: "75%", marginTop: "8px" }} />
      </div>
    </div>
  );
}
