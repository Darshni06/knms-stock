import { useState } from "react";
import { T } from "../../utils/theme";
import { PageHeader } from "../../components/UI";
import { resetClassData, resetAllData } from "../../firebase/services";

function ConfirmResetModal({ target, onConfirm, onCancel, resetting }) {
  const [typed, setTyped] = useState("");
  const ready = typed.trim().toUpperCase() === "RESET";

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#C53030" }}>⚠️ Confirm Reset</div>
          <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.muted }}>×</button>
        </div>
        <div style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "#742A2A" }}>
          This will permanently delete all logged entries for&nbsp;
          <strong>{target === "all" ? "ALL CLASSES" : target}</strong>.
          <br />Allocated counts, issue counts, flags, and notes will all be cleared.
          <br /><strong>This cannot be undone.</strong>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label className="form-label">Type <strong>RESET</strong> to confirm</label>
          <input
            className="form-input" placeholder="Type RESET here…"
            value={typed} onChange={e => setTyped(e.target.value)}
            style={{ borderColor: ready ? "#C53030" : "" }} autoFocus
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={resetting}>Cancel</button>
          <button
            style={{
              flex: 2, border: "none", borderRadius: 10, padding: "10px 18px",
              fontFamily: "Sora", fontSize: 13, fontWeight: 700,
              cursor: ready && !resetting ? "pointer" : "not-allowed",
              background: ready ? "#C53030" : "#FEB2B2", color: "white", transition: "all .15s",
            }}
            onClick={ready ? onConfirm : undefined}
            disabled={!ready || resetting}
          >
            {resetting ? "Resetting…" : `Reset ${target === "all" ? "All Classes" : target}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Receives classes + dept from AdminLayout via props
export default function ResetPage({ classes: classesProp = [], dept = "PP" }) {
  const [selectedClass, setSelectedClass] = useState(classesProp[0] || "");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [resetting,     setResetting]     = useState(false);
  const [lastReset,     setLastReset]     = useState(null);

  const handleReset = async () => {
    setResetting(true);
    try {
      if (confirmTarget === "all") {
        await resetAllData(classesProp);
        setLastReset({ target: "All Classes", time: new Date().toLocaleString() });
      } else {
        await resetClassData(confirmTarget);
        setLastReset({ target: confirmTarget, time: new Date().toLocaleString() });
      }
    } catch (e) {
      console.error("Reset error:", e);
    }
    setResetting(false);
    setConfirmTarget(null);
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={`Admin — ${dept} Department`}
        title="Reset Data"
        subtitle="Clear teacher-entered logs after each cycle"
      />

      {/* Info box */}
      <div style={{ background: "rgba(44,181,168,.05)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.slate, marginBottom: 8 }}>What gets reset:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, color: T.muted }}>
          {["✓ Count allocated per class", "✓ Issue counts (broken, missing, paint, purchase, repair)", "✓ Flag types", "✓ Notes / remarks"]
            .map(line => <div key={line}>{line}</div>)}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: T.peach, fontWeight: 600 }}>
          ✗ Material names, details, and material counts are NOT deleted.
        </div>
      </div>

      {/* Success message */}
      {lastReset && (
        <div style={{ background: "rgba(72,187,120,.1)", border: "1px solid rgba(72,187,120,.3)", borderRadius: 10, padding: "12px 18px", marginBottom: 24, fontSize: 13, color: "#276749", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <div><strong>{lastReset.target}</strong> reset at {lastReset.time}. Teachers can now start fresh entries.</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 700 }}>

        {/* Reset specific class */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 22, marginBottom: 10 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.slate, marginBottom: 6 }}>Reset Specific Class</div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 18, lineHeight: 1.5 }}>
            Clear all log entries for one class only. Other classes remain untouched.
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Select Class</label>
            <select className="form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {classesProp.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="btn" style={{
            width: "100%", justifyContent: "center",
            background: "#FFF5F5", color: "#C53030",
            border: "1.5px solid #FEB2B2", fontWeight: 700, fontSize: 13,
          }} onClick={() => setConfirmTarget(selectedClass)}>
            🗑️ Reset {selectedClass}
          </button>
        </div>

        {/* Reset all classes */}
        <div className="card" style={{ padding: 24, borderColor: "#FEB2B2" }}>
          <div style={{ fontSize: 22, marginBottom: 10 }}>🔄</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#C53030", marginBottom: 6 }}>Reset All Classes</div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 18, lineHeight: 1.5 }}>
            Clear all log entries across every class in the <strong>{dept}</strong> department at once.
          </div>
          <div style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#742A2A" }}>
            ⚠️ Affects all <strong>{classesProp.length} classes</strong> in {dept} department.
          </div>
          <button className="btn" style={{
            width: "100%", justifyContent: "center",
            background: "#C53030", color: "white",
            border: "none", fontWeight: 700, fontSize: 13,
            boxShadow: "0 2px 10px rgba(197,48,48,.3)",
          }} onClick={() => setConfirmTarget("all")}>
            🗑️ Reset All Classes
          </button>
        </div>
      </div>

      {confirmTarget && (
        <ConfirmResetModal
          target={confirmTarget}
          onConfirm={handleReset}
          onCancel={() => setConfirmTarget(null)}
          resetting={resetting}
        />
      )}
    </div>
  );
}