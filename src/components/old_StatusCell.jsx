import { FLAG_META } from "../utils/theme";

// Shows in admin table: issuedCount + flags
// Shows in teacher table: available + issuesCount + flags
export function StatusCell({ status, onClick, isAdmin }) {
  const flags = status
    ? Object.entries(status.flags || {}).filter(([, v]) => v).map(([k]) => k)
    : [];

  const hasIssues = flags.length > 0 || (status?.issuesCount > 0);

  const bg = hasIssues
    ? "rgba(255,237,213,.5)"
    : (isAdmin ? status?.issuedCount != null : status?.available != null)
      ? "rgba(240,255,248,.6)"
      : "white";

  // What count to show in admin vs teacher
  const mainCount = isAdmin ? status?.issuedCount : status?.available;

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
          {/* Main count */}
          {mainCount != null && (
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2A38", fontFamily: "DM Mono, monospace", marginBottom: 2 }}>
              {mainCount}
            </div>
          )}
          {/* Teacher: issues count badge */}
          {!isAdmin && status?.issuesCount > 0 && (
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
          {/* Notes dot */}
          {status.notes && flags.length === 0 && !hasIssues && (
            <div style={{ fontSize: 10, color: "#7A8FA6" }}>📝</div>
          )}
        </>
      )}
    </td>
  );
}
