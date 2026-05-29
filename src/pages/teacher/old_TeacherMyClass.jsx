import { useState, useEffect, useCallback } from "react";
import { T, FLAG_META } from "../../utils/theme";
import { PageHeader, Spinner, SearchInput, EmptyState } from "../../components/UI";
import { StatusEditModal } from "../../components/StatusEditModal";
import {
  getCategories, getItems, getAllStatusForCategory, setClassStatus,
} from "../../firebase/services";

// ─── Status Badge shown on each item row ─────────────────────────────────────
function StatusBadge({ status }) {
  if (!status) return (
    <span style={{ fontSize: 12, color: "#C8D8D7", fontWeight: 500 }}>Not recorded</span>
  );

  const flags = Object.entries(status.flags || {}).filter(([, v]) => v);
  const hasIssues = flags.length > 0 || (status.issuesCount != null && status.issuesCount > 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {/* Available count */}
      {status.available != null && (
        <span style={{
          fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 15,
          color: T.slate, background: "#F0FAF9", borderRadius: 7,
          padding: "2px 10px", border: "1px solid rgba(44,181,168,.2)"
        }}>
          ✓ {status.available}
        </span>
      )}
      {/* Issues count */}
      {status.issuesCount != null && status.issuesCount > 0 && (
        <span style={{
          fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 14,
          color: "#C05621", background: "rgba(232,135,106,.1)", borderRadius: 7,
          padding: "2px 10px", border: "1px solid rgba(232,135,106,.3)"
        }}>
          ⚠ {status.issuesCount}
        </span>
      )}
      {/* Flag chips */}
      {flags.map(([k]) => (
        <span key={k} style={{
          fontSize: 12, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
          background: FLAG_META[k].bg, color: FLAG_META[k].color,
          display: "inline-flex", alignItems: "center", gap: 4
        }}>
          {FLAG_META[k].icon} {FLAG_META[k].label}
        </span>
      ))}
      {/* OK label if recorded with no issues */}
      {!hasIssues && status.available != null && (
        <span style={{ fontSize: 12, color: "#48BB78", fontWeight: 600 }}>OK</span>
      )}
      {/* Notes */}
      {status.notes && (
        <span style={{ fontSize: 11, color: T.muted, fontStyle: "italic" }}>📝 {status.notes.slice(0, 40)}{status.notes.length > 40 ? "…" : ""}</span>
      )}
    </div>
  );
}

// ─── Main Teacher Page ────────────────────────────────────────────────────────
export default function TeacherMyClass({ className }) {
  const [cats, setCats]                 = useState([]);
  const [activeCatId, setActiveCatId]   = useState(null);
  const [items, setItems]               = useState([]);
  const [statusMap, setStatusMap]       = useState({});
  const [search, setSearch]             = useState("");
  const [filterFlag, setFilterFlag]     = useState("all");
  const [loading, setLoading]           = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [editModal, setEditModal]       = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  // Load categories once
  useEffect(() => {
    getCategories().then(c => {
      setCats(c);
      if (c.length > 0) setActiveCatId(c[0].id);
      setLoading(false);
    });
  }, []);

  // Load items + status when category changes
  useEffect(() => {
    if (!activeCatId || !className) return;
    loadData(activeCatId);
  }, [activeCatId, className]);

  const loadData = useCallback(async (catId) => {
    setLoadingItems(true);
    const fetchedItems = await getItems(catId);
    const fetchedStatus = await getAllStatusForCategory(catId, fetchedItems);
    setItems(fetchedItems);
    setStatusMap(fetchedStatus);
    setLoadingItems(false);
  }, [className]);

  const handleStatusSave = async (data) => {
    if (!editModal) return;
    setSavingStatus(true);
    await setClassStatus(activeCatId, editModal.item.id, className, data);
    await loadData(activeCatId);
    setSavingStatus(false);
    setEditModal(null);
  };

  // Filter items
  const filtered = items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    const status = statusMap[item.id]?.[className];
    if (filterFlag === "recorded")   return !!status;
    if (filterFlag === "unrecorded") return !status;
    if (filterFlag !== "all") {
      if (!status?.flags?.[filterFlag]) return false;
    }
    return true;
  });

  // Count issues for summary
  const issueCount = items.filter(item => {
    const s = statusMap[item.id]?.[className];
    if (!s) return false;
    const hasFlag = Object.values(s.flags || {}).some(v => v);
    const hasIssueCnt = s.issuesCount != null && s.issuesCount > 0;
    return hasFlag || hasIssueCnt;
  }).length;

  const recordedCount = items.filter(item => statusMap[item.id]?.[className]).length;

  if (loading) return <Spinner />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={`Class ${className}`}
        title="My Materials"
        subtitle={`${recordedCount} of ${items.length} recorded · ${issueCount} issue${issueCount !== 1 ? "s" : ""}`}
      />

      {/* Progress bar */}
      {items.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>
            <span>RECORDING PROGRESS</span>
            <span>{Math.round((recordedCount / items.length) * 100)}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 99, background: T.border, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: `linear-gradient(90deg, ${T.teal}, #48BB78)`,
              width: `${(recordedCount / items.length) * 100}%`,
              transition: "width .4s ease"
            }} />
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {cats.map(cat => (
          <div key={cat.id}
            className={`tab ${activeCatId === cat.id ? "active" : ""}`}
            onClick={() => setActiveCatId(cat.id)}>
            {cat.icon} {cat.name}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search materials…" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { value: "all", label: "All" },
            { value: "recorded", label: "✓ Recorded" },
            { value: "unrecorded", label: "○ Not yet" },
            ...Object.entries(FLAG_META).map(([k, m]) => ({ value: k, label: `${m.icon} ${m.label}` }))
          ].map(f => (
            <button key={f.value}
              onClick={() => setFilterFlag(f.value)}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "Sora", transition: "all .14s",
                border: `1.5px solid ${filterFlag === f.value ? T.teal : T.border}`,
                background: filterFlag === f.value ? "rgba(44,181,168,.1)" : "white",
                color: filterFlag === f.value ? T.teal2 : T.muted,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Item list */}
      {loadingItems ? <Spinner /> : (
        filtered.length === 0
          ? <EmptyState icon="📭" title="No items found" subtitle="Try a different search or filter." />
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((item, idx) => {
                const status = statusMap[item.id]?.[className] || null;
                const hasIssue = status && Object.values(status.flags || {}).some(v => v);
                const isRecorded = !!status;

                return (
                  <div
                    key={item.id}
                    onClick={() => setEditModal({ item, classId: className })}
                    className="card"
                    style={{
                      padding: "14px 18px",
                      cursor: "pointer",
                      borderLeft: `4px solid ${hasIssue ? T.peach : isRecorded ? "#48BB78" : T.border}`,
                      transition: "all .15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = ""}
                  >
                    {/* Left: item info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, fontFamily: "DM Mono, monospace", minWidth: 24 }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14, color: T.slate }}>{item.name}</span>
                      </div>
                      {item.details && (
                        <div style={{ fontSize: 11, color: T.muted, marginLeft: 32 }}>{item.details}</div>
                      )}
                      <div style={{ marginTop: 6, marginLeft: 32 }}>
                        <StatusBadge status={status} />
                      </div>
                    </div>

                    {/* Right: edit button */}
                    <div style={{
                      flexShrink: 0,
                      width: 36, height: 36, borderRadius: 9,
                      background: hasIssue ? "rgba(232,135,106,.12)" : isRecorded ? "rgba(72,187,120,.1)" : "rgba(44,181,168,.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, color: hasIssue ? T.peach : isRecorded ? "#48BB78" : T.teal,
                    }}>
                      {hasIssue ? "⚠️" : isRecorded ? "✓" : "＋"}
                    </div>
                  </div>
                );
              })}
            </div>
          )
      )}

      {/* Status Edit Modal */}
      {editModal && (
        <StatusEditModal
          item={editModal.item}
          classId={className}
          existing={statusMap[editModal.item.id]?.[className] || null}
          onClose={() => setEditModal(null)}
          onSave={handleStatusSave}
          saving={savingStatus}
          isAdmin={false}
        />
      )}
    </div>
  );
}
