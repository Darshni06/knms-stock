import { useState, useEffect } from "react";
import { T, FLAG_META, CLASSES } from "../../utils/theme";
import { PageHeader, Spinner, EmptyState } from "../../components/UI";
import { getAllIssues, getIssuesForClass } from "../../firebase/services";

function exportCSV(issues, classFilter) {
  const rows = [
    ["Category", "Item", "Class", "Allocated",
     "Broken (count)", "Missing (count)", "Paint/Varnish (count)", "Purchase (count)", "Repair (count)",
     "Notes"],
    ...issues.map(i => [
      i.category, i.item, i.classId, i.allocated ?? "",
      i.flagCounts?.broken   ?? (i.flags?.broken   ? "✓" : ""),
      i.flagCounts?.missing  ?? (i.flags?.missing  ? "✓" : ""),
      i.flagCounts?.paint    ?? (i.flags?.paint    ? "✓" : ""),
      i.flagCounts?.purchase ?? (i.flags?.purchase ? "✓" : ""),
      i.flagCounts?.repair   ?? (i.flags?.repair   ? "✓" : ""),
      i.notes,
    ])
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `knms-issues${classFilter ? `-${classFilter}` : ""}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage({ role, classFilter }) {
  const isAdmin = role === "admin";
  const [issues, setIssues]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [flagFilter, setFlagFilter] = useState("all");
  const [classF, setClassF]         = useState(classFilter || "all");

  useEffect(() => { loadIssues(); }, []);

  const loadIssues = async () => {
    setLoading(true);
    const data = classFilter
      ? await getIssuesForClass(classFilter)
      : await getAllIssues();
    setIssues(data);
    setLoading(false);
  };

  const filtered = issues.filter(issue => {
    if (flagFilter !== "all") {
      const flagOn   = issue.flags?.[flagFilter];
      const cntOn    = issue.flagCounts?.[flagFilter] != null && issue.flagCounts[flagFilter] > 0;
      if (!flagOn && !cntOn) return false;
    }
    if (!classFilter && classF !== "all" && issue.classId !== classF) return false;
    return true;
  });

  // Group by category
  const grouped = {};
  filtered.forEach(issue => {
    if (!grouped[issue.category]) grouped[issue.category] = { icon: issue.categoryIcon, issues: [] };
    grouped[issue.category].issues.push(issue);
  });

  // Summary totals per flag type across all filtered issues
  const flagTotals = Object.fromEntries(
    Object.keys(FLAG_META).map(k => [
      k,
      filtered.reduce((acc, i) => {
        const cnt = i.flagCounts?.[k];
        // if teacher entered counts, sum them; else count the issue row itself
        if (cnt != null && cnt > 0) return acc + cnt;
        if (cnt == null && i.flags?.[k]) return acc + 1;
        return acc;
      }, 0)
    ])
  );

  if (loading) return <Spinner />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={isAdmin ? "Admin View" : "Teacher View"}
        title="Reports"
        subtitle={`${filtered.length} item${filtered.length !== 1 ? "s" : ""} with issues`}
        action={isAdmin && filtered.length > 0 && (
          <button className="btn btn-ghost" onClick={() => exportCSV(filtered, classFilter)}>
            ⬇️ Export CSV
          </button>
        )}
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ value: "all", label: "All Issues" },
            ...Object.entries(FLAG_META).map(([k, m]) => ({ value: k, label: `${m.icon} ${m.label}` }))
          ].map(f => (
            <button key={f.value}
              onClick={() => setFlagFilter(f.value)}
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
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 120 }}
            value={classF}
            onChange={e => setClassF(e.target.value)}
          >
            <option value="all">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Summary chips — per flag type with total count */}
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
            {/* Category header */}
            <div style={{ padding: "14px 20px", background: "#F8FCFC", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: T.slate }}>{catName}</span>
              <span className="chip" style={{ background: "rgba(232,135,106,.12)", color: T.peach, marginLeft: "auto" }}>
                {catIssues.length} item{catIssues.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Issue rows */}
            <div style={{ padding: "0 20px" }}>
              {catIssues.map((issue, idx) => {
                const activeFlags = Object.entries(issue.flags || {}).filter(([, v]) => v);
                const activeCounts = Object.entries(issue.flagCounts || {}).filter(([, v]) => v != null && v > 0);

                return (
                  <div key={idx} className="issue-row">
                    <div style={{ flex: 1 }}>
                      {/* Item name + class + allocated */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: T.slate }}>{issue.item}</span>
                        <span style={{ background: "rgba(44,181,168,.12)", color: T.teal2, borderRadius: 6, padding: "1px 8px", fontWeight: 700, fontSize: 11 }}>
                          {issue.classId}
                        </span>
                        {issue.allocated != null && (
                          <span style={{ fontSize: 11, color: T.muted, background: "#F0FAF9", borderRadius: 5, padding: "1px 7px", fontFamily: "DM Mono, monospace" }}>
                            allocated: {issue.allocated}
                          </span>
                        )}
                      </div>

                      {/* Per-flag counts (teacher-entered) */}
                      {activeCounts.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: activeFlags.length > 0 ? 6 : 0 }}>
                          {activeCounts.map(([k, v]) => (
                            <span key={k} className="chip"
                              style={{ background: FLAG_META[k].bg, color: FLAG_META[k].color, fontSize: 12, padding: "4px 10px" }}>
                              {FLAG_META[k].icon} {FLAG_META[k].label}:&nbsp;
                              <strong style={{ fontFamily: "DM Mono, monospace" }}>{v}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Admin flag chips (no count — just type) */}
                      {activeCounts.length === 0 && activeFlags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 0 }}>
                          {activeFlags.map(([k]) => (
                            <span key={k} className="chip" style={{ background: FLAG_META[k].bg, color: FLAG_META[k].color }}>
                              {FLAG_META[k].icon} {FLAG_META[k].label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
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
    </div>
  );
}
