import { useState, useRef } from "react";
import { T } from "../utils/theme";

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return { rows: [], error: "File is empty or has no data rows." };

  const headers  = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());
  const nameIdx  = headers.indexOf("name");
  const detIdx   = headers.indexOf("details");
  const countIdx = headers.indexOf("materialcount");

  if (nameIdx === -1) return { rows: [], error: 'Column "name" is required but not found. Check your file headers.' };

  const rows = [], errors = [];
  for (let i = 1; i < lines.length; i++) {
    const cols  = lines[i].match(/(".*?"|[^",\n]+)/g) || [];
    const clean = cols.map(c => c.replace(/^"|"$/g, "").trim());
    const name  = clean[nameIdx] || "";
    if (!name) { errors.push(`Row ${i + 1}: missing name — skipped`); continue; }
    rows.push({
      name,
      details:       detIdx   !== -1 ? clean[detIdx]   || "" : "",
      materialCount: countIdx !== -1 && clean[countIdx] ? Number(clean[countIdx]) : null,
    });
  }
  return { rows, errors };
}

export function ImportItemsModal({ catName, onClose, onImport }) {
  const inputRef                  = useRef();
  const [parsed,    setParsed]    = useState(null);
  const [importing, setImporting] = useState(false);
  const [done,      setDone]      = useState(false);
  const [fileErr,   setFileErr]   = useState("");

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileErr(""); setParsed(null); setDone(false);
    if (!file.name.endsWith(".csv")) { setFileErr("Please upload a .csv file."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseCSV(ev.target.result);
      if (result.error) { setFileErr(result.error); return; }
      setParsed(result);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsed || !parsed.rows.length) return;
    setImporting(true);
    await onImport(parsed.rows);
    setImporting(false);
    setDone(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 540 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.slate }}>📥 Import Items</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Category: <strong>{catName}</strong></div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.muted }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 16 }}>

          {/* Format guide */}
          <div style={{ background: "#F8FCFC", border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: T.teal2, marginBottom: 8, textTransform: "uppercase", letterSpacing: .5 }}>
              Required File Format — .csv
            </div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: T.slate, background: "white", borderRadius: 7, padding: "10px 13px", border: `1px solid ${T.border}`, lineHeight: 1.9 }}>
              <div style={{ color: T.teal2, fontWeight: 700 }}>name,details,materialCount</div>
              <div>Pink Tower,10 cubes,9</div>
              <div>Broad Stairs,10 pieces,9</div>
              <div>Long Rods,10 rods,</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: T.muted, display: "flex", flexDirection: "column", gap: 4 }}>
              <div>• <strong>name</strong> — required. Item name.</div>
              <div>• <strong>details</strong> — optional. e.g. "10 cubes" or "1 set".</div>
              <div>• <strong>materialCount</strong> — optional. Total pieces. Leave blank if unknown.</div>
              <div style={{ marginTop: 4, color: T.peach, fontWeight: 600 }}>⚠ First row must be the header exactly as shown above.</div>
            </div>
          </div>

          {/* Upload zone */}
          <div>
            <label className="form-label">Upload CSV File</label>
            <div
              style={{ border: `2px dashed ${fileErr ? "#FEB2B2" : T.border}`, borderRadius: 10, padding: "22px 16px", textAlign: "center", background: fileErr ? "#FFF5F5" : "#FAFCFC", cursor: "pointer", transition: "all .15s" }}
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile({ target: { files: [f] } }); }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: T.slate, marginBottom: 4 }}>Click to choose or drag & drop your CSV</div>
              <div style={{ fontSize: 11, color: T.muted }}>Only .csv files accepted</div>
              <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
            </div>
            {fileErr && <div style={{ marginTop: 8, fontSize: 12, color: "#C53030" }}>⚠ {fileErr}</div>}
          </div>

          {/* Preview table */}
          {parsed && !done && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.slate, marginBottom: 8 }}>
                Preview — {parsed.rows.length} item{parsed.rows.length !== 1 ? "s" : ""} ready to import
                {parsed.errors.length > 0 && <span style={{ color: T.peach, marginLeft: 10 }}>({parsed.errors.length} skipped)</span>}
              </div>
              {parsed.errors.length > 0 && (
                <div style={{ background: "rgba(232,135,106,.08)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                  {parsed.errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: T.peach }}>{e}</div>)}
                </div>
              )}
              <div style={{ maxHeight: 200, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 9 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F5FAFA" }}>
                      {["#","Name","Details","Count"].map(h => (
                        <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: T.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: .4, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid #F0F7F6`, background: i % 2 === 0 ? "white" : "#FBFDFD" }}>
                        <td style={{ padding: "6px 10px", color: T.muted, fontFamily: "DM Mono, monospace" }}>{i + 1}</td>
                        <td style={{ padding: "6px 10px", fontWeight: 600, color: T.slate }}>{row.name}</td>
                        <td style={{ padding: "6px 10px", color: T.muted }}>{row.details || "—"}</td>
                        <td style={{ padding: "6px 10px", fontFamily: "DM Mono, monospace", color: row.materialCount != null ? "#5A67D8" : T.muted }}>
                          {row.materialCount != null ? row.materialCount : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Done */}
          {done && (
            <div style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#276749" }}>
                {parsed?.rows.length} item{parsed?.rows.length !== 1 ? "s" : ""} imported into {catName}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>{done ? "Close" : "Cancel"}</button>
            {!done && (
              <button className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }}
                onClick={handleImport} disabled={!parsed || !parsed.rows.length || importing}>
                {importing ? "Importing…" : `Import ${parsed ? parsed.rows.length : 0} Items`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}