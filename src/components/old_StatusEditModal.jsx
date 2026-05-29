import { useState } from "react";
import { T, FLAG_META } from "../utils/theme";

// Both admin and teacher see the same fields now:
// - Available Count (physically present in class)
// - Issues Count (how many of those have problems)
// - Issue type flags
// - Notes
// Admin additionally sees the item's totalCount (read-only, set on item creation)

export function StatusEditModal({ item, classId, existing, onClose, onSave, saving }) {
  const [available,   setAvailable]   = useState(existing?.available   ?? "");
  const [issuesCount, setIssuesCount] = useState(existing?.issuesCount ?? "");
  const [flags, setFlags] = useState(
    existing?.flags || { broken: false, missing: false, paint: false, purchase: false, repair: false }
  );
  const [notes, setNotes] = useState(existing?.notes || "");

  const toggle = (f) => setFlags(p => ({ ...p, [f]: !p[f] }));

  const handleSave = () => {
    onSave({
      available:   available   === "" ? null : Number(available),
      issuesCount: issuesCount === "" ? null : Number(issuesCount),
      flags,
      notes,
    });
  };

  const handleClear = () => {
    setAvailable("");
    setIssuesCount("");
    setFlags({ broken: false, missing: false, paint: false, purchase: false, repair: false });
    setNotes("");
  };

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

          {/* Allocated + Issues Count side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="form-label">
                Count Allocated <span style={{ color: "#48BB78", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>✓</span>
              </label>
              <input
                className="form-input" type="number" min="0"
                placeholder="Count given to this class…"
                value={available}
                onChange={e => setAvailable(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">
                Issues Count <span style={{ color: T.peach, fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>⚠</span>
              </label>
              <input
                className="form-input" type="number" min="0"
                placeholder="Count with issues…"
                value={issuesCount}
                onChange={e => setIssuesCount(e.target.value)}
                style={{ borderColor: issuesCount !== "" && Number(issuesCount) > 0 ? T.peach : "" }}
              />
            </div>
          </div>

          {/* Issue type flags */}
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
          {(activeFlags.length > 0 || notes || (issuesCount !== "" && Number(issuesCount) > 0)) && (
            <div style={{ background: "#F0FAF9", border: "1.5px solid rgba(44,181,168,.25)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.teal2, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Summary</div>
              {issuesCount !== "" && Number(issuesCount) > 0 && (
                <div style={{ fontSize: 12, color: T.peach, fontWeight: 700, marginBottom: 6 }}>⚠️ {issuesCount} with issues</div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: notes ? 8 : 0 }}>
                {activeFlags.map(([k]) => (
                  <span key={k} className="chip" style={{ background: FLAG_META[k].bg, color: FLAG_META[k].color }}>
                    {FLAG_META[k].icon} {FLAG_META[k].label}
                  </span>
                ))}
              </div>
              {notes && <div style={{ fontSize: 12, color: T.slateM, fontStyle: "italic" }}>"{notes}"</div>}
            </div>
          )}

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
