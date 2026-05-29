import { FLAG_META } from "../utils/theme";

// Shows available count (teacher-entered) + issuesCount + flags
// Same display for both admin table and teacher table
export function StatusCell({ status, onClick }) {
  const flags = status
    ? Object.entries(status.flags || {}).filter(([, v]) => v).map(([k]) => k)
    : [];

  const hasIssues = flags.length > 0 || (status?.issuesCount != null && status.issuesCount > 0);

  const bg = hasIssues
    ? "rgba(255,237,213,.55)"
    : status?.available != null
      ? "rgba(240,255,248,.7)"
      : "white";

  return (
    <td
      className="status-cell"
      style={{ background: bg, cursor: "pointer" }}
      onClick={onClick}
    >
      {!status ? (
        <div className="status-cell-empty">—</div>
      ) : (
        <>
          {/* Available count — green */}
          {status.available != null && (
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2A38", fontFamily: "DM Mono, monospace", marginBottom: 2 }}>
              {status.available}
            </div>
          )}
          {/* Issues count — orange */}
          {status.issuesCount != null && status.issuesCount > 0 && (
            <div style={{ fontSize: 11, color: "#C05621", fontWeight: 700, marginBottom: 2 }}>
              ⚠ {status.issuesCount}
            </div>
          )}
          {/* Flag icons */}
          {flags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {flags.map(f => <span key={f} style={{ fontSize: 12 }}>{FLAG_META[f].icon}</span>)}
            </div>
          )}
          {/* Notes dot — only if nothing else shown */}
          {status.notes && !hasIssues && status.available == null && (
            <div style={{ fontSize: 10, color: "#7A8FA6" }}>📝</div>
          )}
        </>
      )}
    </td>
  );
}
