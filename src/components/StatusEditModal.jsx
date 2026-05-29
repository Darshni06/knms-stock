import { useState } from "react";
import { T, FLAG_META } from "../utils/theme";

// isAdmin=true  → shows "Allocated Count" + flag toggles (no per-flag counts)
// isAdmin=false → shows "Allocated Count" + per-flag issue counts (no toggles)

export function StatusEditModal({ item, classId, existing, onClose, onSave, saving, isAdmin }) {
  const [allocated, setAllocated] = useState(existing?.allocated ?? "");

  // Per-flag issue counts — teacher only
  const [flagCounts, setFlagCounts] = useState(
    existing?.flagCounts || { broken: "", missing: "", paint: "", purchase: "", repair: "" }
  );

  // Flag toggles — admin only
  const [flags, setFlags] = useState(
    existing?.flags || { broken: false, missing: false, paint: false, purchase: false, repair: false }
  );

  const [notes, setNotes] = useState(existing?.notes || "");

  const toggle = (f) => setFlags(p => ({ ...p, [f]: !p[f] }));

  const setFlagCount = (f, val) =>
    setFlagCounts(p => ({ ...p, [f]: val }));

  const handleSave = () => {
    if (isAdmin) {
      onSave({
        allocated: allocated === "" ? null : Number(allocated),
        flags,
        flagCounts: null,
        notes,
      });
    } else {
      // derive flags from flagCounts > 0
      const derivedFlags = Object.fromEntries(
        Object.entries(flagCounts).map(([k, v]) => [k, v !== "" && Number(v) > 0])
      );
      onSave({
        allocated:  allocated === "" ? null : Number(allocated),
        flags:      derivedFlags,
        flagCounts: Object.fromEntries(
          Object.entries(flagCounts).map(([k, v]) => [k, v === "" ? null : Number(v)])
        ),
        notes,
      });
    }
  };

  const handleClear = () => {
    setAllocated("");
    setFlagCounts({ broken: "", missing: "", paint: "", purchase: "", repair: "" });
    setFlags({ broken: false, missing: false, paint: false, purchase: false, repair: false });
    setNotes("");
  };

  // total issues for preview (teacher)
  const totalIssues = Object.values(flagCounts)
    .reduce((acc, v) => acc + (v !== "" && Number(v) > 0 ? Number(v) : 0), 0);

  const activeFlags = Object.entries(flags).filter(([, v]) => v);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.slate }}>{item.name}</div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "rgba(44,181,168,.12)", color: T.teal2, borderRadius: 6, padding: "2px 9px", fontWeight: 700, fontSize: 12 }}>
                {classId}
              </span>
              {item.details && <span style={{ fontSize: 12, color: T.muted }}>{item.details}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.muted, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Allocated Count — both roles */}
          <div>
            <label className="form-label">
              Count Available <span style={{ color: "#48BB78", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>✓</span>
            </label>
            <input
              className="form-input" type="number" min="0"
              placeholder="Count given to this class…"
              value={allocated}
              onChange={e => setAllocated(e.target.value)}
            />
          </div>

          {/* ADMIN: flag toggles */}
          {isAdmin && (
            <div>
              <label className="form-label">Issue Type</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {Object.entries(FLAG_META).map(([key, meta]) => (
                  <button key={key} className="flag-btn" onClick={() => toggle(key)}
                    style={flags[key] ? { borderColor: meta.color, background: meta.bg, color: meta.color } : {}}>
                    {meta.icon} {meta.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TEACHER: per-flag issue counts */}
          {!isAdmin && (
            <div>
              <label className="form-label">Issues Count per Type</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                {Object.entries(FLAG_META).map(([key, meta]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      minWidth: 160, padding: "6px 10px", borderRadius: 8,
                      background: flagCounts[key] !== "" && Number(flagCounts[key]) > 0 ? meta.bg : "#F8FCFC",
                      border: `1.5px solid ${flagCounts[key] !== "" && Number(flagCounts[key]) > 0 ? meta.color : T.border}`,
                      fontSize: 13, fontWeight: 600,
                      color: flagCounts[key] !== "" && Number(flagCounts[key]) > 0 ? meta.color : T.muted,
                    }}>
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </div>
                    <input
                      className="form-input"
                      type="number" min="0"
                      placeholder="0"
                      value={flagCounts[key]}
                      onChange={e => setFlagCount(key, e.target.value)}
                      style={{
                        width: 90, textAlign: "center",
                        borderColor: flagCounts[key] !== "" && Number(flagCounts[key]) > 0 ? meta.color : "",
                        fontFamily: "DM Mono, monospace", fontWeight: 700,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="form-label">Notes / Remarks</label>
            <textarea
              className="form-textarea"
              placeholder="Describe condition, issue details…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Summary preview */}
          {(isAdmin ? activeFlags.length > 0 : totalIssues > 0) || notes ? (
            <div style={{ background: "#F0FAF9", border: "1.5px solid rgba(44,181,168,.25)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.teal2, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>Summary</div>
              {!isAdmin && totalIssues > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                  {Object.entries(flagCounts).map(([k, v]) =>
                    v !== "" && Number(v) > 0 ? (
                      <span key={k} className="chip" style={{ background: FLAG_META[k].bg, color: FLAG_META[k].color }}>
                        {FLAG_META[k].icon} {FLAG_META[k].label}: <strong>{v}</strong>
                      </span>
                    ) : null
                  )}
                </div>
              )}
              {isAdmin && activeFlags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: notes ? 6 : 0 }}>
                  {activeFlags.map(([k]) => (
                    <span key={k} className="chip" style={{ background: FLAG_META[k].bg, color: FLAG_META[k].color }}>
                      {FLAG_META[k].icon} {FLAG_META[k].label}
                    </span>
                  ))}
                </div>
              )}
              {notes && <div style={{ fontSize: 12, color: T.slateM, fontStyle: "italic" }}>"{notes}"</div>}
            </div>
          ) : null}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button className="btn btn-ghost" onClick={handleClear} style={{ fontSize: 12 }}>Clear</button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
