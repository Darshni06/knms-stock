import { useState } from "react";
import { T } from "../utils/theme";

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 36 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div className="spinner" style={{ width: size, height: size }} />
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
      <div>
        {eyebrow && (
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.peach, marginBottom: 6 }}>
            {eyebrow}
          </div>
        )}
        <div style={{ fontSize: 26, fontWeight: 800, color: T.slate }}>{title}</div>
        {subtitle && <div style={{ fontSize: 14, color: T.muted, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: T.muted }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: T.slateM, marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 380, padding: 28 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.slate, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, color: T.muted, marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            style={{ flex: 1 }}
            onClick={onConfirm}
          >
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
      <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 13 }}>🔍</span>
      <input
        className="form-input"
        style={{ paddingLeft: 34 }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const ADMIN_NAV = [
  { id: "dashboard", icon: "⊞",  label: "Dashboard"  },
  { id: "materials", icon: "📦", label: "Materials"   },
  { id: "teachers",  icon: "👤", label: "Teachers"    },
  { id: "reports",   icon: "📊", label: "Reports"     },
  { id: "reset",     icon: "🔄", label: "Reset Data"  },
];
const TEACHER_NAV = [
  { id: "myclass", icon: "⊞",  label: "My Class" },
  { id: "reports", icon: "📊", label: "Reports"   },
];

export function AppSidebar({ role, active, onNav, onLogout, name, className }) {
  const nav = role === "admin" ? ADMIN_NAV : TEACHER_NAV;
  return (
    <div className="sidebar">
      <div style={{ padding: "26px 22px 18px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(44,181,168,.25)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/assets/logo.png" alt="KNMS Logo"
              style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 10 }}
              onError={e => { e.target.style.display = "none"; e.target.parentNode.innerHTML = "📋"; }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "white", letterSpacing: .3 }}>KNMS Materials</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: 500 }}>Stock Tracker</div>
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,.35)" }}>
          {role === "admin" ? "Administrator" : "Teacher"}
        </div>
      </div>

      <nav style={{ flex: 1, padding: "10px 0" }}>
        {nav.map(item => (
          <div key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`}
            onClick={() => onNav(item.id)}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(44,181,168,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: T.teal, fontSize: 14 }}>
            {name?.[0] || "?"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>{className || (role === "admin" ? "Admin" : "")}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ width: "100%", background: "rgba(255,255,255,.08)", border: "none", borderRadius: 8, padding: 7, fontSize: 12, color: "rgba(255,255,255,.6)", cursor: "pointer", fontFamily: "Sora", transition: "all .15s" }}
          onMouseEnter={e => e.target.style.background = "rgba(255,255,255,.15)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,.08)"}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
