import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

/* ── Visual pipe-icon for the hero ────────────────────────────────── */
function HeroGraphic() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      fill="none"
      aria-hidden="true"
      style={{ opacity: 0.18 }}
    >
      {/* Pipeline nodes */}
      {[20, 70, 120, 170].map((x, i) => (
        <React.Fragment key={x}>
          <rect x={x} y={45} width={20} height={30} rx="4" fill="#6366f1" />
          {i < 3 && <path d={`M${x + 20} 60 H${x + 50}`} stroke="#6366f1" strokeWidth="2" strokeDasharray="4 2" />}
        </React.Fragment>
      ))}
      {/* Alert badge on node 2 */}
      <circle cx="130" cy="40" r="8" fill="#ef4444" />
      <text x="130" y="44" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">!</text>
    </svg>
  );
}

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function LoginPage() {
  const { login }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate        = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [touched, setTouched]   = useState({ email: false, password: false });

  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const emailErr    = touched.email    && !validateEmail(email)   ? "Enter a valid email address" : null;
  const passwordErr = touched.password && password.trim() === ""  ? "Password is required"        : null;
  const canSubmit   = !loading && validateEmail(email) && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!canSubmit) return;

    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.ok) {
      navigate("/", { replace: true });
    } else {
      setError(result.error ?? "Sign in failed. Please try again.");
    }
  };

  /* ── Styles ──────────────────────────────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    background: "var(--bg-surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 150ms",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-base)",
        position: "relative",
      }}
    >
      {/* Theme toggle top-right */}
      <button
        type="button"
        onClick={toggleTheme}
        className="icon-btn"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        style={{
          position: "absolute",
          top: "16px",
          right: "20px",
          color: "var(--text-muted)",
          padding: "8px",
          zIndex: 10,
        }}
      >
        {theme === "dark" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
        )}
      </button>

      {/* ── Left hero panel ────────────────────────────────────────── */}
      <div
        style={{
          flex: "0 0 45%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          gap: "24px",
        }}
        className="login-hero"
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "var(--accent)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              CONFIQRA
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
              CONFIGURATION INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>

        <HeroGraphic />

        <div style={{ maxWidth: "320px", textAlign: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px" }}>
            Tenant Configuration Risk Intelligence
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
            Detect conflicting configurations, classify severity, trace evidence, and monitor baseline drift across all university tenant environments.
          </p>
        </div>

        {/* Feature bullets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "280px" }}>
          {[
            "Deterministic conflict detection",
            "Field-level evidence tracing",
            "Versioned baseline drift analysis",
            "18-rule machine-readable catalogue",
          ].map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right login card ───────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 28px" }}>
            Sign in to your CONFIQRA workspace
          </p>

          {/* Demo credentials hint */}
          <div
            style={{
              padding: "10px 14px",
              background: "var(--accent-light)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginBottom: "20px",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "var(--accent)" }}>Demo Mode</strong> — use these credentials to sign in:
            <div style={{ marginTop: "6px", fontFamily: "monospace", fontSize: "11px", color: "var(--text-primary)" }}>
              <div>Email: <span style={{ color: "var(--accent)" }}>demo@confiqra.app</span></div>
              <div>Password: <span style={{ color: "var(--accent)" }}>demo1234</span></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Error */}
            {error && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                  padding: "10px 14px",
                  background: "var(--c-critical-bg)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "var(--c-critical)",
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                {error}
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="login-email"
                style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", letterSpacing: "0.02em" }}
              >
                EMAIL
              </label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="you@example.com"
                style={{
                  ...inputStyle,
                  borderColor: emailErr ? "var(--c-critical)" : undefined,
                }}
                onFocus={(e) => { if (!emailErr) e.target.style.borderColor = "var(--accent)"; }}
                aria-invalid={!!emailErr}
                aria-describedby={emailErr ? "email-error" : undefined}
              />
              {emailErr && (
                <div id="email-error" style={{ fontSize: "11px", color: "var(--c-critical)", marginTop: "4px" }}>{emailErr}</div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label
                  htmlFor="login-password"
                  style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.02em" }}
                >
                  PASSWORD
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  style={{ fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={() => {}}
                  aria-label="Forgot password (not available in demo mode)"
                  title="Not available in demo mode"
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  ref={passwordRef}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="Enter your password"
                  style={{
                    ...inputStyle,
                    paddingRight: "42px",
                    borderColor: passwordErr ? "var(--c-critical)" : undefined,
                  }}
                  onFocus={(e) => { if (!passwordErr) e.target.style.borderColor = "var(--accent)"; }}
                  aria-invalid={!!passwordErr}
                  aria-describedby={passwordErr ? "pw-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "2px",
                    display: "flex",
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordErr && (
                <div id="pw-error" style={{ fontSize: "11px", color: "var(--c-critical)", marginTop: "4px" }}>{passwordErr}</div>
              )}
            </div>

            {/* Remember me */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
              <input
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ accentColor: "var(--accent)", width: "14px", height: "14px", cursor: "pointer" }}
              />
              <label htmlFor="remember-me" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: "14px" }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
          </form>

          <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--border)", fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
            This is a <strong>demo / hackathon environment</strong>.<br />
            No real authentication is performed. Session is scoped to this browser tab (sessionStorage) and clears when the tab is closed.
          </div>
        </div>
      </div>

      {/* Mobile stacking override */}
      <style>{`
        @media (max-width: 700px) {
          .login-hero { display: none !important; }
        }
      `}</style>
    </div>
  );
}
