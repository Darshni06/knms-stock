import { useState, useEffect, useCallback } from "react";
import { T, FLAG_META, CLASSES } from "../../utils/theme";
import { PageHeader, Spinner, SearchInput, ConfirmDialog, EmptyState } from "../../components/UI";
import { StatusCell } from "../../components/StatusCell";
import { StatusEditModal } from "../../components/StatusEditModal";
import { ImportItemsModal } from "../../components/ImportItemsModal";
import {
  getCategories, getItems, getAllStatusForCategory,
  addCategory, updateCategory, deleteCategory,
  addItem, updateItem, deleteItem,
  setClassStatus,
} from "../../firebase/services";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sumAllocated(statusMap, itemId, classList) {
  return classList.reduce((acc, cls) => {
    const v = statusMap[itemId]?.[cls]?.allocated;
    return v != null ? acc + Number(v) : acc;
  }, 0);
}

function countClassesWithIssues(statusMap, itemId, classList) {
  return classList.reduce((acc, cls) => {
    const s = statusMap[itemId]?.[cls];
    if (!s) return acc;
    const hasFlag      = Object.values(s.flags || {}).some(v => v);
    const hasFlagCount = Object.values(s.flagCounts || {}).some(v => v != null && v > 0);
    return (hasFlag || hasFlagCount) ? acc + 1 : acc;
  }, 0);
}

// ─── Category Modal ───────────────────────────────────────────────────────────
function CategoryModal({ existing, onClose, onSave }) {
  const [name, setName]   = useState(existing?.name || "");
  const [icon, setIcon]   = useState(existing?.icon || "📦");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), icon });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.slate }}>{existing ? "Edit Category" : "Add Category"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.muted }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="form-label">Icon (emoji)</label>
            <input className="form-input" value={icon} onChange={e => setIcon(e.target.value)} maxLength={4} style={{ width: 80, fontSize: 22, textAlign: "center" }} />
          </div>
          <div>
            <label className="form-label">Category Name</label>
            <input className="form-input" placeholder="e.g. Sensorial" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Category"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Item Modal ───────────────────────────────────────────────────────────────
function ItemModal({ existing, onClose, onSave }) {
  const [name,          setName]          = useState(existing?.name          || "");
  const [details,       setDetails]       = useState(existing?.details       || "");
  const [materialCount, setMaterialCount] = useState(existing?.materialCount ?? "");
  const [saving,        setSaving]        = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name:          name.trim(),
      details:       details.trim(),
      materialCount: materialCount === "" ? null : Number(materialCount),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.slate }}>{existing ? "Edit Item" : "Add Item"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.muted }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="form-label">Item Name</label>
            <input className="form-input" placeholder="e.g. Pink Tower" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="form-label">Details / Description</label>
            <input className="form-input" placeholder="e.g. 10 cubes" value={details} onChange={e => setDetails(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Material Count <span style={{ color: T.muted, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>(total pieces/sets)</span></label>
            <input className="form-input" type="number" min="0" placeholder="e.g. 10" value={materialCount} onChange={e => setMaterialCount(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Cell ─────────────────────────────────────────────────────────────
function SummaryCell({ value, type }) {
  const styles = {
    total:  { bg: "rgba(44,181,168,.08)",  color: T.teal2   },
    grand:  { bg: "rgba(44,100,168,.08)",  color: "#2B5797" },
    issues: { bg: value > 0 ? "rgba(232,135,106,.13)" : "rgba(240,255,248,.7)", color: value > 0 ? T.peach : "#48BB78" },
  };
  const s = styles[type];
  return (
    <td style={{ padding: "8px 10px", textAlign: "center", verticalAlign: "middle", background: s.bg, minWidth: 72, borderLeft: "2px solid rgba(44,181,168,.13)" }}>
      <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 15, color: s.color }}>{value}</span>
    </td>
  );
}

// ─── Admin Log View (vertical cards like teacher, but for a selected class) ───
function AdminLogView({ items, statusMap, selectedClass, onCellClick }) {
  const issueCount   = items.filter(item => {
    const s = statusMap[item.id]?.[selectedClass];
    if (!s) return false;
    return Object.values(s.flags || {}).some(v => v) ||
           Object.values(s.flagCounts || {}).some(v => v != null && v > 0);
  }).length;
  const recordedCount = items.filter(item => statusMap[item.id]?.[selectedClass]).length;

  return (
    <div>
      {/* Progress */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>
          <span>{selectedClass} — RECORDING PROGRESS</span>
          <span>{items.length > 0 ? Math.round((recordedCount / items.length) * 100) : 0}%</span>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: T.border, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${T.teal}, #48BB78)`, width: `${items.length > 0 ? (recordedCount / items.length) * 100 : 0}%`, transition: "width .4s ease" }} />
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
          {recordedCount} of {items.length} recorded · {issueCount} with issues
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, idx) => {
          const status   = statusMap[item.id]?.[selectedClass] || null;
          const hasIssue = status && (Object.values(status.flags || {}).some(v => v) || Object.values(status.flagCounts || {}).some(v => v != null && v > 0));
          const isRecorded = !!status;

          return (
            <div key={item.id}
              onClick={() => onCellClick(item, selectedClass)}
              className="card"
              style={{
                padding: "14px 18px", cursor: "pointer",
                borderLeft: `4px solid ${hasIssue ? T.peach : isRecorded ? "#48BB78" : T.border}`,
                transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = ""}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, fontFamily: "DM Mono, monospace", minWidth: 24 }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: T.slate }}>{item.name}</span>
                  {item.materialCount != null && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#5A67D8", background: "rgba(90,103,216,.08)", borderRadius: 5, padding: "1px 7px", fontFamily: "DM Mono, monospace" }}>
                      ×{item.materialCount}
                    </span>
                  )}
                </div>
                {item.details && <div style={{ fontSize: 11, color: T.muted, marginLeft: 32 }}>{item.details}</div>}
                {/* Status preview */}
                {status && (
                  <div style={{ marginTop: 6, marginLeft: 32, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {status.allocated != null && (
                      <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 13, color: T.slate, background: "#F0FAF9", borderRadius: 6, padding: "1px 8px", border: "1px solid rgba(44,181,168,.2)" }}>
                        ✓ {status.allocated} allocated
                      </span>
                    )}
                    {Object.entries(status.flagCounts || {}).filter(([, v]) => v != null && v > 0).map(([k, v]) => (
                      <span key={k} style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 20, background: FLAG_META[k].bg, color: FLAG_META[k].color }}>
                        {FLAG_META[k].icon} {FLAG_META[k].label}: {v}
                      </span>
                    ))}
                    {Object.entries(status.flags || {}).filter(([, v]) => v).length > 0 &&
                     Object.entries(status.flagCounts || {}).filter(([, v]) => v != null && v > 0).length === 0 &&
                     Object.entries(status.flags || {}).filter(([, v]) => v).map(([k]) => (
                      <span key={k} style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 20, background: FLAG_META[k].bg, color: FLAG_META[k].color }}>
                        {FLAG_META[k].icon} {FLAG_META[k].label}
                      </span>
                    ))}
                    {!hasIssue && <span style={{ fontSize: 12, color: "#48BB78", fontWeight: 600 }}>OK</span>}
                  </div>
                )}
              </div>
              <div style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 9,
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
    </div>
  );
}

// ─── Materials Page ───────────────────────────────────────────────────────────
export default function MaterialsPage({ role, initialCatId, classes: classesProp, dept = "PP" }) {
  const isAdmin        = role === "admin";
  const visibleClasses = classesProp || CLASSES;
  const classesNoStore = visibleClasses.filter(c => !c.startsWith("Store"));

  // Admin can switch between "table" view and "log" view (per-class card view)
  const [viewMode,      setViewMode]      = useState("table"); // "table" | "log"
  const [logClass,      setLogClass]      = useState(visibleClasses[0] || "");

  const [cats, setCats]               = useState([]);
  const [activeCatId, setActiveCatId] = useState(initialCatId || null);
  const [items, setItems]             = useState([]);
  const [statusMap, setStatusMap]     = useState({});
  const [search, setSearch]           = useState("");
  const [filterFlag, setFilterFlag]   = useState("all");
  const [loading, setLoading]         = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  const [editModal,     setEditModal]     = useState(null);
  const [savingStatus,  setSavingStatus]  = useState(false);
  const [catModal,      setCatModal]      = useState(null);
  const [itemModal,     setItemModal]     = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [showImport,     setShowImport]     = useState(false);

  // Load categories scoped to dept
  useEffect(() => {
    getCategories().then(all => {
      const deptCats = all.filter(c => !c.dept || c.dept === dept);
      setCats(deptCats);
      if (!activeCatId && deptCats.length > 0) setActiveCatId(deptCats[0].id);
      else if (activeCatId && !deptCats.find(c => c.id === activeCatId)) {
        setActiveCatId(deptCats[0]?.id || null);
      }
      setLoading(false);
    });
  }, [dept]);

  useEffect(() => {
    if (!activeCatId) return;
    loadCategoryData(activeCatId);
  }, [activeCatId]);

  // Reset logClass when dept changes
  useEffect(() => {
    setLogClass(visibleClasses[0] || "");
  }, [dept]);

  const loadCategoryData = useCallback(async (catId) => {
    setLoadingItems(true);
    const fetchedItems  = await getItems(catId);
    const fetchedStatus = await getAllStatusForCategory(catId, fetchedItems);
    setItems(fetchedItems);
    setStatusMap(fetchedStatus);
    setLoadingItems(false);
  }, []);

  const filtered = items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterFlag !== "all") {
      const hasFlag = visibleClasses.some(cls => statusMap[item.id]?.[cls]?.flags?.[filterFlag]);
      if (!hasFlag) return false;
    }
    return true;
  });

  const handleStatusSave = async (data) => {
    if (!editModal) return;
    setSavingStatus(true);
    await setClassStatus(activeCatId, editModal.item.id, editModal.classId, data);
    await loadCategoryData(activeCatId);
    setSavingStatus(false);
    setEditModal(null);
  };

  const handleCatSave = async (data) => {
    if (catModal === "new") await addCategory({ ...data, dept, order: (cats.length + 1) * 10 });
    else                    await updateCategory(catModal.id, data);
    const all = await getCategories();
    setCats(all.filter(c => !c.dept || c.dept === dept));
  };

  const handleCatDelete = async () => {
    await deleteCategory(confirmDelete.id);
    const all = await getCategories();
    const updated = all.filter(c => !c.dept || c.dept === dept);
    setCats(updated);
    if (activeCatId === confirmDelete.id) setActiveCatId(updated[0]?.id || null);
    setConfirmDelete(null);
  };

  const handleItemSave = async (data) => {
    if (itemModal === "new") await addItem(activeCatId, { ...data, order: (items.length + 1) * 10 });
    else                     await updateItem(activeCatId, itemModal.id, data);
    await loadCategoryData(activeCatId);
  };
  const handleImport = async (rows) => {
    for (let i = 0; i < rows.length; i++) {
      await addItem(activeCatId, {
        name:          rows[i].name,
        details:       rows[i].details || "",
        materialCount: rows[i].materialCount ?? null,
        order:         (items.length + i + 1) * 10,
      });
    }
    await loadCategoryData(activeCatId);
  };

  const handleItemDelete = async () => {
    await deleteItem(activeCatId, confirmDelete.id);
    await loadCategoryData(activeCatId);
    setConfirmDelete(null);
  };

  if (loading) return <Spinner />;

  const th = (extra = {}) => ({
    padding: "11px 10px", textAlign: "center",
    fontSize: 11, fontWeight: 700, color: T.muted,
    letterSpacing: .5, textTransform: "uppercase",
    borderBottom: `2px solid ${T.border}`,
    background: "#F5FAFA", minWidth: 80,
    ...extra,
  });

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={`${dept} Department`}
        title="Materials"
        action={isAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setCatModal("new")} style={{ fontSize: 12 }}>+ Category</button>
            {activeCatId && <button className="btn btn-ghost" onClick={() => setShowImport(true)} style={{ fontSize: 12 }}>📥 Import Items</button>}
            {activeCatId && <button className="btn btn-primary" onClick={() => setItemModal("new")}>+ Add Item</button>}
          </div>
        )}
      />

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        {cats.map(cat => (
          <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div className={`tab ${activeCatId === cat.id ? "active" : ""}`} onClick={() => setActiveCatId(cat.id)}>
              {cat.icon} {cat.name}
            </div>
            {isAdmin && activeCatId === cat.id && (
              <div style={{ display: "flex", gap: 2 }}>
                <button onClick={() => setCatModal(cat)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: .7, padding: "2px 4px" }}>✏️</button>
                <button onClick={() => setConfirmDelete({ type: "cat", id: cat.id })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: .7, padding: "2px 4px" }}>🗑️</button>
              </div>
            )}
          </div>
        ))}
        {cats.length === 0 && (
          <div style={{ color: T.muted, fontSize: 13 }}>No categories yet — click + Category to add one.</div>
        )}
      </div>

      {/* View mode switcher — admin only */}
      {isAdmin && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          {[
            { id: "table", label: "📊 Table View" },
            { id: "log",   label: "📋 Log by Class" },
          ].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              style={{
                padding: "7px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "Sora", transition: "all .15s",
                background: viewMode === v.id ? T.teal : "white",
                color: viewMode === v.id ? "white" : T.muted,
                border: `1.5px solid ${viewMode === v.id ? T.teal : T.border}`,
              }}>
              {v.label}
            </button>
          ))}
          {/* Class picker for log view */}
          {viewMode === "log" && (
            <select className="form-select" style={{ width: "auto", minWidth: 120 }}
              value={logClass} onChange={e => setLogClass(e.target.value)}>
              {visibleClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Search + filter toolbar — table view only */}
      {viewMode === "table" && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search items…" />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[{ value: "all", label: "All" }, ...Object.entries(FLAG_META).map(([k, m]) => ({ value: k, label: `${m.icon} ${m.label}` }))].map(f => (
              <button key={f.value} onClick={() => setFilterFlag(f.value)}
                style={{
                  padding: "6px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${filterFlag === f.value ? T.teal : T.border}`,
                  background: filterFlag === f.value ? "rgba(44,181,168,.1)" : "white",
                  color: filterFlag === f.value ? T.teal2 : T.muted,
                  fontFamily: "Sora", transition: "all .14s",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loadingItems ? <Spinner /> : (
        <>
          {/* LOG VIEW — admin logs per class like teacher */}
          {viewMode === "log" && isAdmin && (
            <AdminLogView
              items={items}
              statusMap={statusMap}
              selectedClass={logClass}
              onCellClick={(item, cls) => setEditModal({ item, classId: cls })}
            />
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <>
              {isAdmin && (
                <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
                  {[
                    { color: T.teal2,   bg: "rgba(44,181,168,.1)",   label: "Available (excl. Store)" },
                    { color: "#2B5797", bg: "rgba(44,100,168,.08)",  label: "Grand Total (incl. Store)" },
                    { color: T.peach,   bg: "rgba(232,135,106,.12)", label: "Issues" },
                  ].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.muted }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: l.bg, border: `1.5px solid ${l.color}` }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ overflowX: "auto", borderRadius: 14, boxShadow: "0 2px 14px rgba(30,42,56,.07)", border: `1px solid ${T.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                  <thead>
                    <tr style={{ background: "#F5FAFA" }}>
                      <th style={{ ...th({ textAlign: "left", paddingLeft: 16, position: "sticky", left: 0, zIndex: 3, minWidth: 220, background: "#F5FAFA" }) }}>Material</th>
                      {isAdmin && (
                        <th style={{ ...th({ minWidth: 64, color: "#5A67D8", background: "rgba(90,103,216,.06)", borderRight: `1px solid ${T.border}` }) }}>Count</th>
                      )}
                      {visibleClasses.map(cls => (
                        <th key={cls} style={th()}>{cls}</th>
                      ))}
                      {isAdmin && <>
                        <th style={{ ...th({ background: "rgba(44,181,168,.08)", color: T.teal2, borderLeft: "2px solid rgba(44,181,168,.18)" }) }}>
                          Available<br /><span style={{ fontSize: 9, fontWeight: 500 }}>excl. Store</span>
                        </th>
                        <th style={{ ...th({ background: "rgba(44,100,168,.07)", color: "#2B5797", borderLeft: "2px solid rgba(44,100,168,.15)" }) }}>
                          Available<br /><span style={{ fontSize: 9, fontWeight: 500 }}>+Store</span>
                        </th>
                        <th style={{ ...th({ background: "rgba(232,135,106,.08)", color: T.peach, borderLeft: "2px solid rgba(232,135,106,.18)" }) }}>Issues</th>
                        <th style={th({ minWidth: 70 })}>Actions</th>
                      </>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={visibleClasses.length + (isAdmin ? 6 : 1)} style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 14 }}>
                          No items found
                        </td>
                      </tr>
                    ) : filtered.map((item, idx) => {
                      const rowBg      = idx % 2 === 0 ? "white" : "#FBFDFD";
                      const total      = sumAllocated(statusMap, item.id, classesNoStore);
                      const grandTotal = sumAllocated(statusMap, item.id, visibleClasses);
                      const issues     = countClassesWithIssues(statusMap, item.id, classesNoStore);

                      return (
                        <tr key={item.id} style={{ borderBottom: `1px solid #F0F7F6`, background: rowBg }}>
                          <td style={{ padding: "11px 16px", position: "sticky", left: 0, background: rowBg, zIndex: 1, borderRight: `1px solid ${T.border}` }}>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: T.slate }}>{item.name}</div>
                            {item.details && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{item.details}</div>}
                          </td>
                          {isAdmin && (
                            <td style={{ padding: "8px 10px", textAlign: "center", verticalAlign: "middle", background: "rgba(90,103,216,.04)", borderRight: `1px solid ${T.border}` }}>
                              {item.materialCount != null
                                ? <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 14, color: "#5A67D8" }}>{item.materialCount}</span>
                                : <span style={{ color: T.border, fontSize: 13 }}>—</span>
                              }
                            </td>
                          )}
                          {visibleClasses.map(cls => (
                            <StatusCell
                              key={cls}
                              status={statusMap[item.id]?.[cls] || null}
                              onClick={() => setEditModal({ item, classId: cls })}
                            />
                          ))}
                          {isAdmin && <>
                            <SummaryCell value={total}      type="total"  />
                            <SummaryCell value={grandTotal} type="grand"  />
                            <SummaryCell value={issues}     type="issues" />
                            <td style={{ padding: "8px 10px", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                                <button onClick={() => setItemModal(item)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: .7 }}>✏️</button>
                                <button onClick={() => setConfirmDelete({ type: "item", id: item.id })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: .7 }}>🗑️</button>
                              </div>
                            </td>
                          </>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Modals */}
      {editModal && (
        <StatusEditModal
          item={editModal.item}
          classId={editModal.classId}
          existing={statusMap[editModal.item.id]?.[editModal.classId] || null}
          onClose={() => setEditModal(null)}
          onSave={handleStatusSave}
          saving={savingStatus}
        />
      )}
      {catModal && (
        <CategoryModal
          existing={catModal !== "new" ? catModal : null}
          onClose={() => setCatModal(null)}
          onSave={handleCatSave}
        />
      )}
      {itemModal && (
        <ItemModal
          existing={itemModal !== "new" ? itemModal : null}
          onClose={() => setItemModal(null)}
          onSave={handleItemSave}
        />
      )}
      {showImport && activeCatId && (
        <ImportItemsModal
          catName={cats.find(c => c.id === activeCatId)?.name || ""}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.type === "cat" ? "Category" : "Item"}?`}
          message={`This will permanently delete the ${confirmDelete.type} and all associated data. This cannot be undone.`}
          danger
          onConfirm={confirmDelete.type === "cat" ? handleCatDelete : handleItemDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}