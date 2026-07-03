import { useState, useEffect } from "react";
import { T, FLAG_META } from "../../utils/theme";
import { PageHeader, Spinner } from "../../components/UI";
import { getCategories, getItems, getClassStatus } from "../../firebase/services";

export default function AdminDashboard({ onNav, classes = [], dept = "PP" }) {
  const [cats, setCats]           = useState([]);
  const [catIssues, setCatIssues] = useState({});
  const [totals, setTotals]       = useState({ issues: 0, broken: 0, purchase: 0, repair: 0 });
  const [loading, setLoading]     = useState(true);

  useEffect(() => { loadData(); }, [dept]);

  const loadData = async () => {
    setLoading(true);
    // Only load categories for this department
    const all = await getCategories();
    const categories = all.filter(c => !c.dept || c.dept === dept);
    setCats(categories);

    const issueMap = {};
    let issues = 0, broken = 0, purchase = 0, repair = 0;

    for (const cat of categories) {
      const items = await getItems(cat.id);
      let catCount = 0;
      for (const item of items) {
        const snap = await getClassStatus(cat.id, item.id);
        for (const cls of classes) {
          const s = snap[cls];
          if (s) {
            const hasFlag      = Object.values(s.flags || {}).some(v => v);
            const hasFlagCount = Object.values(s.flagCounts || {}).some(v => v != null && v > 0);
            if (hasFlag || hasFlagCount) {
              catCount++; issues++;
              if (s.flags?.broken)   broken++;
              if (s.flags?.purchase) purchase++;
              if (s.flags?.repair)   repair++;
            }
          }
        }
      }
      issueMap[cat.id] = catCount;
    }

    setCatIssues(issueMap);
    setTotals({ issues, broken, purchase, repair });
    setLoading(false);
  };

  if (loading) return <Spinner />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={`${dept} Department`}
        title="Dashboard"
        subtitle={`${cats.length} categories · ${classes.length} classes`}
      />

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Categories",    value: cats.length,     icon: "📁", accent: T.teal    },
          { label: "Total Issues",  value: totals.issues,   icon: "⚠️", accent: T.peach  },
          { label: "Broken Items",  value: totals.broken,   icon: "🔴", accent: "#C53030" },
          { label: "Need Purchase", value: totals.purchase, icon: "🛒", accent: "#276749" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -12, right: -8, fontSize: 48, opacity: .07 }}>{s.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: .6, textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: s.accent, fontFamily: "DM Mono, monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category grid */}
      <div style={{ fontSize: 15, fontWeight: 700, color: T.slate, marginBottom: 14 }}>
        Categories — {dept} Department
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {cats.map(cat => {
          const count = catIssues[cat.id] || 0;
          return (
            <div key={cat.id} className="card"
              style={{ padding: 20, cursor: "pointer", transition: "all .2s" }}
              onClick={() => onNav("materials", { catId: cat.id })}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(44,181,168,.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 22 }}>{cat.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14.5, color: T.slate }}>{cat.name}</span>
                </div>
                {count > 0
                  ? <span className="chip" style={{ background: "rgba(232,135,106,.12)", color: T.peach }}>⚠️ {count}</span>
                  : <span className="chip" style={{ background: "rgba(72,187,120,.1)", color: "#276749" }}>✓ OK</span>
                }
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>{classes.length} classes</div>
            </div>
          );
        })}
        {cats.length === 0 && (
          <div style={{ color: T.muted, fontSize: 14, padding: 20 }}>
            No categories for {dept} department yet. Go to Materials → + Category to add one.
          </div>
        )}
      </div>
    </div>
  );
}