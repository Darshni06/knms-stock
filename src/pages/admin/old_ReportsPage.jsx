import { useState, useEffect } from "react";
import { T, FLAG_META, CLASSES } from "../../utils/theme";
import { PageHeader, Spinner, EmptyState } from "../../components/UI";
import { getAllIssues, getIssuesForClass } from "../../firebase/services";

function exportCSV(issues, classFilter) {
  const rows = [
    ["Category", "Item", "Class", "Available", "Broken", "Missing", "Paint/Varnish", "Purchase", "Repair", "Notes"],
    ...issues.map(i => [
      i.category, i.item, i.classId, i.available ?? "",
      i.flags?.broken ? "Yes" : "", i.flags?.missing ? "Yes" : "",
      i.flags?.paint ? "Yes" : "", i.flags?.purchase ? "Yes" : "",
      i.flags?.repair ? "Yes" : "", i.notes,
    ])
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `knms-issues${classFilter ? `-${classFilter}` : ""}.csv`; a.click();
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
    if (flagFilter !== "all" && !issue.flags?.[flagFilter]) return false;
    if (!classFilter && classF !== "all" && issue.classId !== classF) return false;
    return true;
  });

  // Group by category
  const grouped = {};
  filtered.forEach(issue => {
    if (!grouped[issue.category]) grouped[issue.category] = { icon: issue.categoryIcon, issues: [] };
    grouped[issue.category].issues.push(issue);
  });

  if (loading) return <Spinner />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={isAdmin ? "Admin View" : "Teacher View"}
        title="Reports"
        subtitle={`${filtered.length} issue${filtered.length !== 1 ? "s" : ""} found`}
        action={isAdmin && filtered.length > 0 && (
          <button className="btn btn-ghost" onClick={() => exportCSV(filtered, classFilter)}>
            ⬇️ Export CSV
          </button>
        )}
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ value: "all", label: "All Issues" }, ...Object.entries(FLAG_META).map(([k, m]) => ({ value: k, label: `${m.icon} ${m.label}` }))].map(f => (
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

      {/* Summary chips */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {Object.entries(FLAG_META).map(([key, meta]) => {
            const count = filtered.filter(i => i.flags?.[key]).length;
            if (!count) return null;
            return (
              <span key={key} className="chip" style={{ background: meta.bg, color: meta.color, fontSize: 12, padding: "5px 12px" }}>
                {meta.icon} {meta.label}: <strong>{count}</strong>
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
                {catIssues.length} issue{catIssues.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ padding: "0 20px" }}>
              {catIssues.map((issue, idx) => (
                <div key={idx} className="issue-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: T.slate }}>{issue.item}</span>
                      <span style={{ background: "rgba(44,181,168,.12)", color: T.teal2, borderRadius: 6, padding: "1px 8px", fontWeight: 700, fontSize: 11 }}>{issue.classId}</span>
                      {issue.available != null && (
                        <span style={{ fontSize: 11, color: T.muted }}>Qty: {issue.available}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {Object.entries(issue.flags || {}).filter(([, v]) => v).map(([k]) => (
                        <span key={k} className="chip" style={{ background: FLAG_META[k].bg, color: FLAG_META[k].color }}>
                          {FLAG_META[k].icon} {FLAG_META[k].label}
                        </span>
                      ))}
                    </div>
                    {issue.notes && (
                      <div style={{ marginTop: 6, fontSize: 12, color: T.slateM, fontStyle: "italic" }}>"{issue.notes}"</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
