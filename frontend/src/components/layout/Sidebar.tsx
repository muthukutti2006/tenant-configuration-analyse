import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ScanSearch,
  AlertTriangle,
  Database,
  ListChecks,
  FileText,
  GitCompare,
  BookOpen,
  GitBranch,
  ChevronLeft,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "ANALYSIS",
    items: [
      { to: "/analyze", label: "Analyze Config", icon: ScanSearch },
      { to: "/drift", label: "Config Drift", icon: GitBranch },
      { to: "/conflicts", label: "All Conflicts", icon: AlertTriangle },
      { to: "/catalog", label: "Rules Catalogue", icon: ListChecks },
    ],
  },
  {
    label: "DATA",
    items: [
      { to: "/configurations", label: "Configurations", icon: Database },
      { to: "/rules", label: "Detection Rules", icon: FileText },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { to: "/approach", label: "Technical Approach", icon: GitCompare },
      { to: "/about", label: "Documentation", icon: BookOpen },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const W = open ? 240 : 64;

  return (
    <aside
      style={{
        width: `${W}px`,
        minHeight: "100vh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 200ms ease",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div
        style={{
          height: "52px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid var(--border)",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ScanSearch size={16} style={{ color: "#fff" }} />
        </div>
        {open && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "0.02em",
                lineHeight: 1.1,
              }}
            >
              CONFIQRA
            </div>
            <div
              style={{
                fontSize: "9px",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
                lineHeight: 1.2,
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Config Intelligence
            </div>
          </div>
        )}
        {open && (
          <button
            onClick={onToggle}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              padding: "2px",
              borderRadius: "4px",
              flexShrink: 0,
            }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: "20px" }}>
            {open && (
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  padding: "0 8px",
                  marginBottom: "4px",
                }}
              >
                {group.label}
              </div>
            )}
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                title={!open ? label : undefined}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: open ? "7px 10px" : "7px",
                  borderRadius: "7px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  background: isActive ? "var(--accent)" : "transparent",
                  textDecoration: "none",
                  marginBottom: "1px",
                  transition: "background 150ms, color 150ms",
                  justifyContent: open ? "flex-start" : "center",
                })}
                className={({ isActive }) =>
                  isActive ? "" : "sidebar-link-hover"
                }
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {open && (
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {open && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Review-2 Prototype</div>
          <div
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              fontFamily: "monospace",
              marginTop: "1px",
            }}
          >
            v2.0.0-review2
          </div>
        </div>
      )}
    </aside>
  );
}
