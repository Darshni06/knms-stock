import { useState, useEffect } from "react";
import { T, FLAG_META, CLASSES } from "../../utils/theme";
import { PageHeader, Spinner, EmptyState, ConfirmDialog } from "../../components/UI";
import { getAllIssues, getIssuesForClass, getAllLogsForExport, resetClassStatus, resetAllData } from "../../firebase/services";

// ─── Excel / CSV export ───────────────────────────────────────────────────────
function buildAndDownload(rows, filename) {
  const csv = rows
    .map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportIssuesExcel(issues, classLabel, monthLabel) {
  const headers = [
    "Month", "Category", "Item", "Material Count", "Class", "Allocated",
    "🔴 Broken", "⚠️ Missing", "🎨 Paint/Varnish", "🛒 Purchase", "🔧 Repair",
    "Total Issues", "Notes",
  ];
  const rows = issues.map(i => {
    const fc       = i.flagCounts || {};
    const broken   = fc.broken   ?? (i.flags?.broken   ? 1 : 0);
    const missing  = fc.missing  ?? (i.flags?.missing  ? 1 : 0);
    const paint    = fc.paint    ?? (i.flags?.paint    ? 1 : 0);
    const purchase = fc.purchase ?? (i.flags?.purchase ? 1 : 0);
    const repair   = fc.repair   ?? (i.flags?.repair   ? 1 : 0);
    const total    = broken + missing + paint + purchase + repair;
    return [
      monthLabel, i.category, i.item, i.materialCount ?? "", i.classId,
      i.allocated ?? "", broken || "", missing || "", paint || "",
      purchase || "", repair || "", total || "", i.notes || "",
    ];
  });
  buildAndDownload(
    [headers, ...rows],
    `KNMS-Issues-${classLabel}-${monthLabel.replace(/ /g, "-")}.csv`
  );
}

function exportFullLogsExcel(logs, classLabel, monthLabel) {
  const headers = [
    "Month", "Category", "Item", "Material Count", "Class", "Allocated",
    "🔴 Broken", "⚠️ Missing", "🎨 Paint/Varnish", "🛒 Purchase", "🔧 Repair",
    "Total Issues", "Notes", "Status",
  ];
  const rows = logs.map(i => {
    const fc       = i.flagCounts || {};
    const broken   = fc.broken   ?? (i.flags?.broken   ? 1 : 0);
    const missing  = fc.missing  ?? (i.flags?.missing  ? 1 : 0);
    const paint    = fc.paint    ?? (i.flags?.paint    ? 1 : 0);
    const purchase = fc.purchase ?? (i.flags?.purchase ? 1 : 0);
    const repair   = fc.repair   ?? (i.flags?.repair   ? 1 : 0);
    const total    = broken + missing + paint + purchase + repair;
    const status   = total > 0 ? "Has Issues" : "OK";
    return [
      monthLabel, i.category, i.item, i.materialCount ?? "", i.classId,
      i.allocated ?? "", broken || "", missing || "", paint || "",
      purchase || "", repair || "", total || "", i.notes || "", status,
    ];
  });
  buildAndDownload(
    [headers, ...rows],
    `KNMS-FullLog-${classLabel}-${monthLabel.replace(/ /g, "-")}.csv`
  );
}

// ─── Reset Confirmation Modal ─────────────────────────────────────────────────
function ResetModal({ onClose, onConfirm, resetting }) {
  const [targetClass, setTargetClass] = useState("ALL");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#C53030" }}>🔄 Reset Teacher Data</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#7A8FA6" }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: "#7A8FA6", marginBottom: 22 }}>
          This permanently deletes all teacher-logged entries (allocated counts, issue counts, flags, notes). Categories and items are NOT affected.
        </div>

        {/* Class selector */}
        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Reset for which class?</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <div
              onClick={() => setTargetClass("ALL")}
              style={{
                padding: "9px 16px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13,
                border: `2px solid ${targetClass === "ALL" ? "#C53030" : "#E2E8F0"}`,
                background: targetClass === "ALL" ? "#FFF5F5" : "white",
                color: targetClass === "ALL" ? "#C53030" : "#7A8FA6",
                transition: "all .14s",
              }}>
              🗑️ All Classes
            </div>
            {CLASSES.map(cls => (
              <div key={cls}
                onClick={() => setTargetClass(cls)}
                style={{
                  padding: "9px 14px", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 13,
                  border: `2px solid ${targetClass === cls ? "#C53030" : "#E2E8F0"}`,
                  background: targetClass === cls ? "#FFF5F5" : "white",
                  color: targetClass === cls ? "#C53030" : "#7A8FA6",
                  transition: "all .14s",
                }}>
                {cls}
              </div>
            ))}
          </div>
        </div>

        {/* Warning box */}
        <div style={{ background: "#FFF5F5", border: "1.5px solid #FEB2B2", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#C53030", marginBottom: 4 }}>
            ⚠️ You are about to reset:
          </div>
          <div style={{ fontSize: 13, color: "#742A2A" }}>
            {targetClass === "ALL"
              ? "All teacher entries across ALL classes will be permanently deleted."
              : `All teacher entries for class ${targetClass} will be permanently deleted.`}
          </div>
          <div style={{ fontSize: 12, color: "#C53030", marginTop: 6, fontStyle: "italic" }}>
            💡 Export the data first if you need a record before resetting.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            onClick={() => onConfirm(targetClass)}
            disabled={resetting}
            style={{
              flex: 2, border: "none", borderRadius: 10, padding: "10px 18px",
              background: "#C53030", color: "white", fontFamily: "Sora",
              fontSize: 13, fontWeight: 700, cursor: resetting ? "not-allowed" : "pointer",
              opacity: resetting ? .7 : 1,
            }}>
            {resetting ? "Resetting…" : `Reset ${targetClass === "ALL" ? "All Classes" : targetClass}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Export Modal ─────────────────────────────────────────────────────────────
function ExportModal({ onClose, monthLabel, month, setMonth }) {
  const [exportClass,   setExportClass]   = useState("ALL");
  const [exportType,    setExportType]    = useState("issues"); // "issues" | "full"
  const [exporting,     setExporting]     = useState(false);
  const [exportDone,    setExportDone]    = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const classLabel = exportClass === "ALL" ? "AllClasses" : exportClass;
    if (exportType === "issues") {
      const data = exportClass === "ALL"
        ? await (await import("../../firebase/services")).getAllIssues()
        : await (await import("../../firebase/services")).getIssuesForClass(exportClass);
      exportIssuesExcel(data, classLabel, monthLabel);
    } else {
      const data = await (await import("../../firebase/services")).getAllLogsForExport(
        exportClass === "ALL" ? null : exportClass
      );
      exportFullLogsExcel(data, classLabel, monthLabel);
    }
    setExporting(false);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.slate }}>📥 Export Teacher Data</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#7A8FA6" }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: "#7A8FA6", marginBottom: 22 }}>
          Download teacher-logged data as a spreadsheet (.csv, opens in Excel).
        </div>

        {/* Month */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Month</label>
          <input
            type="month" className="form-input"
            style={{ width: 180, marginTop: 6 }}
            value={month}
            onChange={e => setMonth(e.target.value)}
          />
        </div>

        {/* Export type */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">What to export</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {[
              { value: "issues", label: "Issues Only", desc: "Only items with flags/issues", icon: "⚠️" },
              { value: "full",   label: "Full Log",    desc: "All entries including OK items", icon: "📋" },
            ].map(opt => (
              <div key={opt.value}
                onClick={() => setExportType(opt.value)}
                style={{
                  flex: 1, padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${exportType === opt.value ? T.teal : "#E2E8F0"}`,
                  background: exportType === opt.value ? "rgba(44,181,168,.06)" : "white",
                  transition: "all .14s",
                }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{opt.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: exportType === opt.value ? T.teal2 : T.slate }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: "#7A8FA6", marginTop: 2 }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Class selector */}
        <div style={{ marginBottom: 22 }}>
          <label className="form-label">Class</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <div
              onClick={() => setExportClass("ALL")}
              style={{
                padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12,
                border: `2px solid ${exportClass === "ALL" ? T.teal : "#E2E8F0"}`,
                background: exportClass === "ALL" ? "rgba(44,181,168,.08)" : "white",
                color: exportClass === "ALL" ? T.teal2 : "#7A8FA6",
                transition: "all .14s",
              }}>
              All Classes
            </div>
            {CLASSES.map(cls => (
              <div key={cls}
                onClick={() => setExportClass(cls)}
                style={{
                  padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12,
                  border: `2px solid ${exportClass === cls ? T.teal : "#E2E8F0"}`,
                  background: exportClass === cls ? "rgba(44,181,168,.08)" : "white",
                  color: exportClass === cls ? T.teal2 : "#7A8FA6",
                  transition: "all .14s",
                }}>
                {cls}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-primary"
            style={{ flex: 2, justifyContent: "center" }}>
            {exportDone ? "✅ Downloaded!" : exporting ? "Preparing…" : "📥 Download Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
export default function ReportsPage({ role, classFilter }) {
  const isAdmin = role === "admin";

  const [issues,      setIssues]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [flagFilter,  setFlagFilter]  = useState("all");
  const [classF,      setClassF]      = useState(classFilter || "all");
  const [month,       setMonth]       = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Modal states
  const [showExport, setShowExport] = useState(false);
  const [showReset,  setShowReset]  = useState(false);
  const [resetting,  setResetting]  = useState(false);
  const [resetDone,  setResetDone]  = useState("");

  useEffect(() => { loadIssues(); }, []);

  const loadIssues = async () => {
    setLoading(true);
    const data = classFilter
      ? await getIssuesForClass(classFilter)
      : await getAllIssues();
    setIssues(data);
    setLoading(false);
  };

  const handleReset = async (targetClass) => {
  setResetting(true);
  if (targetClass === "ALL") {
    await resetAllData();
  } else {
    await resetClassData(targetClass);
  }
  setResetting(false);
  setShowReset(false);
  setResetDone(targetClass === "ALL" ? "All classes reset!" : `${targetClass} reset!`);
  setTimeout(() => setResetDone(""), 3000);
  await loadIssues();
};

  const filtered = issues.filter(issue => {
    if (flagFilter !== "all") {
      const flagOn = issue.flags?.[flagFilter];
      const cntOn  = issue.flagCounts?.[flagFilter] != null && issue.flagCounts[flagFilter] > 0;
      if (!flagOn && !cntOn) return false;
    }
    if (!classFilter && classF !== "all" && issue.classId !== classF) return false;
    return true;
  });

  const grouped = {};
  filtered.forEach(issue => {
    if (!grouped[issue.category]) grouped[issue.category] = { icon: issue.categoryIcon, issues: [] };
    grouped[issue.category].issues.push(issue);
  });

  const flagTotals = Object.fromEntries(
    Object.keys(FLAG_META).map(k => [
      k,
      filtered.reduce((acc, i) => {
        const cnt = i.flagCounts?.[k];
        if (cnt != null && cnt > 0) return acc + cnt;
        if (cnt == null && i.flags?.[k]) return acc + 1;
        return acc;
      }, 0)
    ])
  );

  const [yr, mo] = month.split("-");
  const monthLabel = new Date(Number(yr), Number(mo) - 1)
    .toLocaleString("default", { month: "long", year: "numeric" });

  if (loading) return <Spinner />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={isAdmin ? "Admin View" : "Teacher View"}
        title="Reports"
        subtitle={`${filtered.length} item${filtered.length !== 1 ? "s" : ""} with issues`}
        action={isAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            {/* Export button */}
            <button className="btn btn-primary" onClick={() => setShowExport(true)} style={{ gap: 6 }}>
              📥 Export Excel
            </button>
            {/* Reset button */}
            <button
              onClick={() => setShowReset(true)}
              style={{
                border: "1.5px solid #FEB2B2", borderRadius: 10, padding: "9px 16px",
                background: "white", color: "#C53030", fontFamily: "Sora",
                fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex",
                alignItems: "center", gap: 6, transition: "all .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#FFF5F5"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              🔄 Reset Data
            </button>
          </div>
        )}
      />

      {/* Reset success banner */}
      {resetDone && (
        <div style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#276749", fontWeight: 600 }}>
          ✅ {resetDone} All teacher entries have been cleared.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ value: "all", label: "All Issues" },
            ...Object.entries(FLAG_META).map(([k, m]) => ({ value: k, label: `${m.icon} ${m.label}` }))
          ].map(f => (
            <button key={f.value} onClick={() => setFlagFilter(f.value)}
              style={{
                padding: "6px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${flagFilter === f.value ? T.teal : T.border}`,
                background: flagFilter === f.value ? "rgba(44,181,168,.1)" : "white",
                color: flagFilter === f.value ? T.teal2 : T.muted,
                fontFamily: "Sora", transition: "all .14s",
              }}>
              {f.label}
            </button>
          ))}
        </div>
        {isAdmin && !classFilter && (
          <select className="form-select" style={{ width: "auto", minWidth: 120 }}
            value={classF} onChange={e => setClassF(e.target.value)}>
            <option value="all">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Summary chips */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {Object.entries(FLAG_META).map(([key, meta]) => {
            const total = flagTotals[key];
            if (!total) return null;
            return (
              <span key={key} className="chip"
                style={{ background: meta.bg, color: meta.color, fontSize: 12, padding: "5px 14px" }}>
                {meta.icon} {meta.label}:&nbsp;<strong style={{ fontFamily: "DM Mono, monospace" }}>{total}</strong>
              </span>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="✅" title="No issues found" subtitle="All materials are in good condition!" />
      ) : (
        Object.entries(grouped).map(([catName, { icon, issues: catIssues }]) => (
          <div key={catName} className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", background: "#F8FCFC", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: T.slate }}>{catName}</span>
              <span className="chip" style={{ background: "rgba(232,135,106,.12)", color: T.peach, marginLeft: "auto" }}>
                {catIssues.length} item{catIssues.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ padding: "0 20px" }}>
              {catIssues.map((issue, idx) => {
                const activeFlags  = Object.entries(issue.flags  || {}).filter(([, v]) => v);
                const activeCounts = Object.entries(issue.flagCounts || {}).filter(([, v]) => v != null && v > 0);
                return (
                  <div key={idx} className="issue-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: T.slate }}>{issue.item}</span>
                        <span style={{ background: "rgba(44,181,168,.12)", color: T.teal2, borderRadius: 6, padding: "1px 8px", fontWeight: 700, fontSize: 11 }}>{issue.classId}</span>
                        {issue.materialCount != null && (
                          <span style={{ fontSize: 11, color: "#5A67D8", background: "rgba(90,103,216,.08)", borderRadius: 5, padding: "1px 7px", fontFamily: "DM Mono, monospace", fontWeight: 700 }}>×{issue.materialCount}</span>
                        )}
                        {issue.allocated != null && (
                          <span style={{ fontSize: 11, color: T.muted, background: "#F0FAF9", borderRadius: 5, padding: "1px 7px", fontFamily: "DM Mono, monospace" }}>allocated: {issue.allocated}</span>
                        )}
                      </div>
                      {activeCounts.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                          {activeCounts.map(([k, v]) => (
                            <span key={k} className="chip" style={{ background: FLAG_META[k].bg, color: FLAG_META[k].color, fontSize: 12, padding: "4px 10px" }}>
                              {FLAG_META[k].icon} {FLAG_META[k].label}:&nbsp;<strong style={{ fontFamily: "DM Mono, monospace" }}>{v}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                      {activeCounts.length === 0 && activeFlags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {activeFlags.map(([k]) => (
                            <span key={k} className="chip" style={{ background: FLAG_META[k].bg, color: FLAG_META[k].color }}>
                              {FLAG_META[k].icon} {FLAG_META[k].label}
                            </span>
                          ))}
                        </div>
                      )}
                      {issue.notes && (
                        <div style={{ marginTop: 6, fontSize: 12, color: T.slateM, fontStyle: "italic" }}>"{issue.notes}"</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          month={month}
          setMonth={setMonth}
          monthLabel={monthLabel}
        />
      )}

      {/* Reset Modal */}
      {showReset && (
        <ResetModal
          onClose={() => setShowReset(false)}
          onConfirm={handleReset}
          resetting={resetting}
        />
      )}
    </div>
  );
}
