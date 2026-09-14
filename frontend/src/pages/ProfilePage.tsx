import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { SectionHeader, InlineAlert } from "../components/ui/Shared";
import { User, Mail, Shield, Sun, Moon, Monitor, LogOut, Settings, Lock } from "lucide-react";

/* ── Avatar circle ─────────────────────────────────────────────── */
function Avatar({ initials, size = 48 }: { initials: string; size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.33,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
}

/* ── Section card wrapper ──────────────────────────────────────── */
function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
        <Icon size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

/* ── Labelled field ────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: "6px" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme }       = useTheme();
  const navigate                     = useNavigate();

  const [editing, setEditing]       = useState(false);
  const [draftName, setDraftName]   = useState(user?.name ?? "");
  const [draftEmail, setDraftEmail] = useState(user?.email ?? "");
  const [saveMsg, setSaveMsg]       = useState<string | null>(null);

  const handleSave = () => {
    if (draftName.trim()) {
      updateUser({ name: draftName.trim(), email: draftEmail.trim() });
      setSaveMsg("Profile updated — saved locally in this browser.");
      setEditing(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "13px",
    background: "var(--bg-surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    outline: "none",
    boxSizing: "border-box",
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "700px" }}>
      <SectionHeader
        title="Profile"
        subtitle="Manage your local demo profile and application preferences."
      />

      <InlineAlert type="warning">
        <strong>Demo Mode</strong> — all profile changes are stored in this browser tab's session only (sessionStorage). Changes clear when the tab is closed. No data is sent to a server.
      </InlineAlert>

      {/* ── 1. Profile Overview ──────────────────────────────────── */}
      <SectionCard title="Profile Overview" icon={User}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
          <Avatar initials={user.initials} size={64} />
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>{user.name}</div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>{user.email}</div>
            <div
              style={{
                display: "inline-block",
                marginTop: "6px",
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "var(--accent-light)",
                color: "var(--accent)",
                border: "1px solid rgba(99,102,241,0.25)",
                fontWeight: 600,
              }}
            >
              {user.role}
            </div>
          </div>
        </div>
        {!editing && (
          <button type="button" className="btn-ghost" onClick={() => { setEditing(true); setDraftName(user.name); setDraftEmail(user.email); }}>
            <Settings size={13} /> Edit Profile
          </button>
        )}
      </SectionCard>

      {/* ── 2. Profile Settings (inline edit) ────────────────────── */}
      <SectionCard title="Profile Settings" icon={Settings}>
        {saveMsg && <InlineAlert type="success">{saveMsg}</InlineAlert>}
        <div style={{ marginTop: saveMsg ? "16px" : 0 }}>
          <Field label="FULL NAME">
            <input
              type="text"
              value={editing ? draftName : user.name}
              disabled={!editing}
              onChange={(e) => setDraftName(e.target.value)}
              style={{ ...inputStyle, opacity: editing ? 1 : 0.7, cursor: editing ? "text" : "not-allowed" }}
              onFocus={(e) => { if (editing) e.target.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            />
          </Field>
          <Field label="EMAIL ADDRESS">
            <input
              type="email"
              value={editing ? draftEmail : user.email}
              disabled={!editing}
              onChange={(e) => setDraftEmail(e.target.value)}
              style={{ ...inputStyle, opacity: editing ? 1 : 0.7, cursor: editing ? "text" : "not-allowed" }}
              onFocus={(e) => { if (editing) e.target.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            />
          </Field>
          <Field label="ROLE">
            <input type="text" value={user.role} disabled style={{ ...inputStyle, opacity: 0.55, cursor: "not-allowed" }} />
          </Field>
          {editing ? (
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button type="button" className="btn-primary" onClick={handleSave}>Save Changes</button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
              <Settings size={13} /> Edit
            </button>
          )}
        </div>
      </SectionCard>

      {/* ── 3. Theme Preference ──────────────────────────────────── */}
      <SectionCard title="Theme Preference" icon={Sun}>
        <div style={{ display: "flex", gap: "10px" }}>
          {[
            { label: "Dark",   value: "dark",  icon: Moon },
            { label: "Light",  value: "light", icon: Sun },
          ].map(({ label, value, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => { if (!active) toggleTheme(); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  border: active ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: active ? "var(--accent-light)" : "var(--bg-surface-2)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 150ms",
                }}
                aria-pressed={active}
              >
                <Icon size={18} style={{ color: active ? "var(--accent)" : "var(--text-muted)" }} />
                <span style={{ fontSize: "12px", fontWeight: active ? 700 : 400, color: active ? "var(--accent)" : "var(--text-secondary)" }}>
                  {label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              background: "var(--bg-surface-2)",
              cursor: "not-allowed",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              opacity: 0.45,
            }}
            disabled
            title="System theme detection not available in demo mode"
          >
            <Monitor size={18} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>System</span>
          </button>
        </div>
      </SectionCard>

      {/* ── 4. Account & Security ─────────────────────────────────── */}
      <SectionCard title="Account & Security" icon={Lock}>
        <InlineAlert type="info">
          <strong>Demo environment</strong> — password changes are not persisted. This section is UI-only.
        </InlineAlert>

        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Active session indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Active Session</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>This browser — demo mode</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
              <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>Active</span>
            </div>
          </div>

          {/* Change password (UI only) */}
          <div style={{ padding: "12px 14px", background: "var(--bg-surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Lock size={13} style={{ color: "var(--text-muted)" }} /> Change Password
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="password" placeholder="New password" disabled style={{ ...inputStyle, flex: 1, opacity: 0.5, cursor: "not-allowed" }} />
              <button type="button" className="btn-ghost" disabled style={{ opacity: 0.5, cursor: "not-allowed", whiteSpace: "nowrap" }}>Update</button>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
              Not available in demo mode — no backend authentication.
            </div>
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(239,68,68,0.3)",
              background: "var(--c-critical-bg)",
              color: "var(--c-critical)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              width: "fit-content",
              transition: "background 150ms",
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </SectionCard>

      {/* ── About user ───────────────────────────────────────────── */}
      <div style={{ padding: "12px 16px", background: "var(--bg-surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
        <Shield size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Logged in as <strong style={{ color: "var(--text-secondary)" }}>{user.email}</strong>. Demo environment — session is tab-scoped (sessionStorage). No personal data leaves this browser.
        </span>
      </div>
    </div>
  );
}
