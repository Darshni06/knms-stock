import { useState, useEffect } from "react";
import { T, CLASSES } from "../../utils/theme";
import { PageHeader, Spinner, ConfirmDialog, EmptyState } from "../../components/UI";
import { getAllTeachers, createTeacher, updateTeacher, deleteTeacher } from "../../firebase/services";

function TeacherModal({ existing, onClose, onSave }) {
  const [name, setName]           = useState(existing?.name || "");
  const [email, setEmail]         = useState(existing?.email || "");
  const [password, setPassword]   = useState("");
  const [className, setClassName] = useState(existing?.className || CLASSES[0]);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) { setErr("Name and email are required."); return; }
    if (!existing && !password.trim()) { setErr("Password is required for new teachers."); return; }
    if (!existing && password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setSaving(true); setErr("");
    try {
      await onSave({ name: name.trim(), email: email.trim(), password, className });
      onClose();
    } catch (e) {
      setErr(e.message || "Error saving teacher. Email may already be in use.");
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.slate }}>{existing ? "Edit Teacher" : "Add Teacher"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.muted }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="e.g. Anitha Sundar" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="teacher@knms.edu" value={email}
              onChange={e => setEmail(e.target.value)} disabled={!!existing} />
            {existing && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Email cannot be changed.</div>}
          </div>
          {!existing && (
            <div>
              <label className="form-label">Password (min 6 chars)</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          )}
          <div>
            <label className="form-label">Assigned Class</label>
            <select className="form-select" value={className} onChange={e => setClassName(e.target.value)}>
              {(classesProp || CLASSES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {err && (
            <div style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#C53030" }}>{err}</div>
          )}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : existing ? "Update Teacher" : "Create Teacher"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeachersPage({ classes: classesProp }) {
  const [teachers, setTeachers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // null | "new" | teacherObj
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadTeachers(); }, []);

  const loadTeachers = async () => {
    setLoading(true);
    const list = await getAllTeachers();
    setTeachers(list.sort((a, b) => (a.className || "").localeCompare(b.className || "")));
    setLoading(false);
  };

  const handleSave = async (data) => {
    if (modal === "new") {
      await createTeacher(data);
    } else {
      await updateTeacher(modal.id, { name: data.name, className: data.className });
    }
    await loadTeachers();
  };

  const handleDelete = async () => {
    await deleteTeacher(confirmDelete.id);
    await loadTeachers();
    setConfirmDelete(null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Admin View" title="Teachers"
        subtitle={`${teachers.length} teachers registered`}
        action={<button className="btn btn-primary" onClick={() => setModal("new")}>+ Add Teacher</button>}
      />

      {teachers.length === 0 ? (
        <EmptyState icon="👤" title="No teachers yet" subtitle="Add a teacher to get started." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
          {teachers.map(t => (
            <div key={t.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(44,181,168,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: T.teal, fontSize: 18 }}>
                    {t.name?.[0] || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: T.slate }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{t.email}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setModal(t)}>✏️</button>
                  <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setConfirmDelete(t)}>🗑️</button>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <span className="chip" style={{ background: "rgba(44,181,168,.12)", color: T.teal2, fontWeight: 700 }}>📚 {t.className}</span>
                <span className="chip" style={{ background: "#F0F4F8", color: T.muted }}>Teacher</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TeacherModal
          existing={modal !== "new" ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Teacher?"
          message={`Remove ${confirmDelete.name} from the system? Their login will be disabled. (Note: Firebase Auth deletion requires admin SDK — contact your developer.)`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
