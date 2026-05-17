import { FLAG_META } from "../utils/theme";

export function StatusCell({ status, onClick, readOnly }) {
  const flags = status
    ? Object.entries(status.flags || {}).filter(([, v]) => v).map(([k]) => k)
    : [];

  const bg = flags.length > 0
    ? "rgba(255,237,213,.5)"
    : status?.available != null
      ? "rgba(240,255,248,.6)"
      : "white";

  return (
    <td
      className="status-cell"
      style={{ background: bg, cursor: readOnly ? "default" : "pointer" }}
      onClick={readOnly ? undefined : onClick}
    >
      {!status ? (
        <div className="status-cell-empty">—</div>
      ) : (
        <>
          {status.available != null && (
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2A38", marginBottom: flags.length ? 3 : 0, fontFamily: "DM Mono, monospace" }}>
              {status.available}
            </div>
          )}
          {flags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {flags.map(f => <span key={f} style={{ fontSize: 13 }}>{FLAG_META[f].icon}</span>)}
            </div>
          )}
          {status.notes && flags.length === 0 && (
            <div style={{ fontSize: 10, color: "#7A8FA6" }}>📝</div>
          )}
        </>
      )}
    </td>
  );
}
