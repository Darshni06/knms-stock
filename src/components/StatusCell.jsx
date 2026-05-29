import { FLAG_META } from "../utils/theme";

// Shows in cells:
// - allocated count (green)
// - per-flag issue counts if teacher entered them, else flag icons
export function StatusCell({ status, onClick }) {
  if (!status) {
    return (
      <td className="status-cell" style={{ background: "white", cursor: "pointer" }} onClick={onClick}>
        <div className="status-cell-empty">—</div>
      </td>
    );
  }

  const flags = Object.entries(status.flags || {}).filter(([, v]) => v);
  const flagCounts = status.flagCounts || {};
  const hasIssues = flags.length > 0;

  const bg = hasIssues
    ? "rgba(255,237,213,.55)"
    : status.allocated != null
      ? "rgba(240,255,248,.7)"
      : "white";

  return (
    <td className="status-cell" style={{ background: bg, cursor: "pointer" }} onClick={onClick}>
      {/* Allocated count */}
      {status.allocated != null && (
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2A38", fontFamily: "DM Mono, monospace", marginBottom: 2 }}>
          {status.allocated}
        </div>
      )}
      {/* Per-flag counts (teacher) or flag icons (admin) */}
      {flags.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {flags.map(([f]) => {
            const cnt = flagCounts[f];
            return (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 11 }}>{FLAG_META[f].icon}</span>
                {cnt != null && cnt > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: FLAG_META[f].color, fontFamily: "DM Mono, monospace" }}>{cnt}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Notes dot */}
      {status.notes && !hasIssues && status.allocated == null && (
        <div style={{ fontSize: 10, color: "#7A8FA6" }}>📝</div>
      )}
    </td>
  );
}
