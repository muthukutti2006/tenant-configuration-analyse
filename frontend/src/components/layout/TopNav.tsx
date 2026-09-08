import React, { useEffect, useState } from "react";
import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLocation } from "react-router-dom";

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/analyze": "Analyze Configuration",
  "/conflicts": "All Conflicts",
  "/drift": "Configuration Drift",
  "/configurations": "Configurations",
  "/catalog": "Rules Catalogue",
  "/rules": "Detection Rules",
  "/approach": "Technical Approach",
  "/about": "Documentation",
};

export function TopNav({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const pageLabel = PAGE_LABELS[location.pathname] ?? "CONFIQRA";

  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then((r) => setBackendOk(r.ok))
      .catch(() => setBackendOk(false));
  }, []);

  return (
    <header
      style={{
        height: "52px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "12px",
        flexShrink: 0,
      }}
    >
      <button
        onClick={onMenuToggle}
        style={{
          color: "var(--text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          padding: "6px",
          borderRadius: "6px",
        }}
        aria-label="Toggle sidebar"
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>CONFIQRA</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>/</span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
          {pageLabel}
        </span>
      </div>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* API status */}
        {backendOk !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: backendOk ? "var(--green)" : "var(--c-critical)",
                boxShadow: backendOk ? "0 0 6px var(--green)" : undefined,
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {backendOk ? "API Online" : "API Offline"}
            </span>
          </div>
        )}

        {/* Version badge */}
        <span
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            padding: "2px 7px",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            fontFamily: "monospace",
          }}
        >
          v2.0.0
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          style={{
            color: "var(--text-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            padding: "6px",
            borderRadius: "6px",
          }}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
