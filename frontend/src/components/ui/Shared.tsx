import React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Wifi } from "lucide-react";

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
        gap: "12px",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h1>
          {badge && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 9px",
                borderRadius: "20px",
                background: "var(--accent-light)",
                color: "var(--accent)",
                fontWeight: 600,
                border: "1px solid rgba(99,102,241,0.25)",
                whiteSpace: "nowrap",
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
              margin: "5px 0 0",
              lineHeight: 1.5,
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
        padding: "52px 24px",
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
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.5, maxWidth: "320px" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── ErrorState ─────────────────────────────────────────────────── */
export function ErrorState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: "16px 18px",
        borderRadius: "var(--radius-card)",
        background: "var(--c-critical-bg)",
        border: "1px solid rgba(239,68,68,0.25)",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <AlertCircle size={18} style={{ color: "var(--c-critical)", flexShrink: 0, marginTop: "1px" }} />
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--c-critical)" }}>
          Unable to load data
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px", lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
          <Wifi size={12} />
          {hint ?? "Check that the CONFIQRA backend is running on port 8000."}
        </div>
      </div>
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
        padding: "12px 14px",
        background: "var(--bg-surface-2)",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border)",
        alignItems: "center",
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
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px" }}>
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          pointerEvents: "none",
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
        type="search"
        aria-label={ariaLabel ?? placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          paddingLeft: "30px",
          paddingRight: "10px",
          paddingTop: "7px",
          paddingBottom: "7px",
          fontSize: "13px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-primary)",
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

/* ── SelectFilter ───────────────────────────────────────────────── */
export function SelectFilter({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 10px",
        fontSize: "13px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-primary)",
        cursor: "pointer",
        outline: "none",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── InlineAlert ─────────────────────────────────────────────────── */
export function InlineAlert({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "success" | "error";
  children: React.ReactNode;
}) {
  const styles: Record<string, React.CSSProperties> = {
    info:    { background: "var(--accent-light)", border: "1px solid rgba(99,102,241,0.25)", color: "var(--accent)" },
    warning: { background: "var(--c-medium-bg)", border: "1px solid rgba(234,179,8,0.25)", color: "var(--c-medium)" },
    success: { background: "var(--green-light)", border: "1px solid rgba(34,197,94,0.25)", color: "var(--green)" },
    error:   { background: "var(--c-critical-bg)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--c-critical)" },
  };
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "var(--radius-sm)",
        fontSize: "12px",
        lineHeight: 1.5,
        ...styles[type],
      }}
    >
      {children}
    </div>
  );
}
