import React, { useEffect, useRef, useState } from "react";
import { Menu, Sun, Moon, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

const PAGE_LABELS: Record<string, string> = {
  "/":               "Dashboard",
  "/analyze":        "Analyze Configuration",
  "/conflicts":      "All Conflicts",
  "/drift":          "Configuration Drift",
  "/configurations": "Configurations",
  "/catalog":        "Rules Catalogue",
  "/rules":          "Detection Rules",
  "/approach":       "Technical Approach",
  "/about":          "Documentation",
  "/profile":        "Profile",
};

/* ── Avatar circle (TopNav compact) ───────────────────────────── */
function AvatarBadge({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: "10px",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
}

export function TopNav({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { theme, toggleTheme }      = useTheme();
  const { user, logout }            = useAuth();
  const location                    = useLocation();
  const navigate                    = useNavigate();

  const [backendOk, setBackendOk]   = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen]     = useState(false);
  const menuRef                     = useRef<HTMLDivElement>(null);

  const pageLabel = PAGE_LABELS[location.pathname] ?? "CONFIQRA";

  // Health check
  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then((r) => setBackendOk(r.ok))
      .catch(() => setBackendOk(false));
  }, []);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 14px",
    fontSize: "13px",
    color: "var(--text-secondary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    borderRadius: "6px",
    transition: "background 120ms, color 120ms",
  };

  return (
    <header
      style={{
        height: "52px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "10px",
        flexShrink: 0,
        position: "relative",
        zIndex: 40,
      }}
    >
      {/* Sidebar toggle */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="icon-btn"
        style={{ color: "var(--text-muted)", padding: "6px" }}
        aria-label="Toggle sidebar"
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>CONFIQRA</span>
        <span style={{ fontSize: "11px", color: "var(--border-strong)", flexShrink: 0 }}>/</span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pageLabel}
        </span>
      </div>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {/* API status */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
          title={backendOk === null ? "Checking API…" : backendOk ? "Backend API is online" : "Backend API is offline"}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: backendOk === null ? "var(--text-muted)" : backendOk ? "var(--green)" : "var(--c-critical)",
              boxShadow: backendOk ? "0 0 6px var(--green)" : undefined,
              transition: "background 300ms",
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {backendOk === null ? "Checking…" : backendOk ? "API Online" : "API Offline"}
          </span>
        </div>

        {/* Version */}
        <span style={{ fontSize: "10px", color: "var(--text-muted)", padding: "2px 7px", border: "1px solid var(--border)", borderRadius: "var(--radius-xs)", fontFamily: "monospace" }}>
          v2.0
        </span>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="icon-btn"
          style={{ color: "var(--text-secondary)", padding: "6px" }}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Profile dropdown trigger */}
        {user && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={`Profile menu for ${user.name}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: menuOpen ? "var(--bg-surface-3)" : "none",
                border: "1px solid",
                borderColor: menuOpen ? "var(--border-strong)" : "var(--border)",
                borderRadius: "20px",
                padding: "3px 8px 3px 3px",
                cursor: "pointer",
                transition: "background 150ms, border-color 150ms",
              }}
            >
              <AvatarBadge initials={user.initials} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name.split(" ")[0]}
              </span>
              <ChevronDown size={12} style={{ color: "var(--text-muted)", transition: "transform 150ms", transform: menuOpen ? "rotate(180deg)" : "none" }} />
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div
                role="menu"
                aria-label="Profile menu"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: "220px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-card)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                  zIndex: 100,
                  animation: "fadeIn 0.12s ease",
                }}
              >
                {/* User info header */}
                <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AvatarBadge initials={user.initials} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: "6px" }}>
                  <button
                    role="menuitem"
                    type="button"
                    style={menuItemStyle}
                    onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface-2)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                  >
                    <User size={14} style={{ color: "var(--text-muted)" }} />
                    Profile
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    style={menuItemStyle}
                    onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface-2)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                  >
                    <Settings size={14} style={{ color: "var(--text-muted)" }} />
                    Profile Settings
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    style={menuItemStyle}
                    onClick={() => { toggleTheme(); }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-surface-2)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                  >
                    {theme === "dark" ? <Sun size={14} style={{ color: "var(--text-muted)" }} /> : <Moon size={14} style={{ color: "var(--text-muted)" }} />}
                    {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
                  </button>
                </div>

                {/* Divider + logout */}
                <div style={{ borderTop: "1px solid var(--border)", padding: "6px" }}>
                  <button
                    role="menuitem"
                    type="button"
                    style={{ ...menuItemStyle, color: "var(--c-critical)" }}
                    onClick={handleLogout}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--c-critical-bg)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                  >
                    <LogOut size={14} style={{ color: "var(--c-critical)" }} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
