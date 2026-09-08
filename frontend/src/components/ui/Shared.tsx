import React from "react";
import type { LucideIcon } from "lucide-react";

/* ── SectionHeader ──────────────────────────────────────────────── */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: string;
}

export function SectionHeader({ title, subtitle, actions, badge }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "20px",
        gap: "12px",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {badge && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "20px",
                background: "var(--accent-light)",
                color: "var(--accent)",
                fontWeight: 600,
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              margin: "6px 0 0",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}

/* ── EmptyState ─────────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "12px",
          background: "var(--bg-surface-2)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={22} style={{ color: "var(--text-muted)" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
          {title}
        </p>
        {description && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{description}</p>
        )}
      </div>
    </div>
  );
}

/* ── ErrorState ─────────────────────────────────────────────────── */
export function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "8px",
        background: "var(--c-critical-bg)",
        border: "1px solid rgba(239,68,68,0.25)",
        color: "var(--c-critical)",
        fontSize: "13px",
      }}
    >
      <strong>Error:</strong> {message}
      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
        Is the backend running? <code>uvicorn main:app --reload</code>
      </p>
    </div>
  );
}

/* ── FilterBar ──────────────────────────────────────────────────── */
interface FilterBarProps {
  children: React.ReactNode;
}
export function FilterBar({ children }: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        padding: "12px 16px",
        background: "var(--bg-surface-2)",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        marginBottom: "16px",
      }}
    >
      {children}
    </div>
  );
}

/* ── SearchInput ────────────────────────────────────────────────── */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px" }}>
      <svg
        style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
        }}
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          paddingLeft: "30px",
          paddingRight: "10px",
          paddingTop: "6px",
          paddingBottom: "6px",
          fontSize: "13px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          color: "var(--text-primary)",
          outline: "none",
        }}
      />
    </div>
  );
}

/* ── SelectFilter ───────────────────────────────────────────────── */
export function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "6px 10px",
        fontSize: "13px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        color: "var(--text-primary)",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
