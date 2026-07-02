import { useState } from "react";
import { AppSidebar } from "../../components/UI";
import { useAuth } from "../../contexts/AuthContext";
import { logoutUser } from "../../firebase/services";
import { DEPARTMENTS } from "../../utils/theme";
import AdminDashboard from "./AdminDashboard";
import MaterialsPage from "./MaterialsPage";
import TeachersPage from "./TeachersPage";
import ReportsPage from "./ReportsPage";

export default function AdminLayout() {
  const { profile } = useAuth();
  const [page, setPage]           = useState("dashboard");
  const [pageCtx, setPageCtx]     = useState({});
  const [dept, setDept]           = useState("PP"); // "PP" or "P"

  const handleNav    = (id, ctx = {}) => { setPage(id); setPageCtx(ctx); };
  const handleLogout = () => logoutUser();

  const classes = DEPARTMENTS[dept];

  return (
    <div>
      <AppSidebar
        role="admin"
        active={page}
        onNav={handleNav}
        onLogout={handleLogout}
        name={profile?.name || "Admin"}
        className=""
      />
      <div className="main">

        {/* Department switcher — shown on every page */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 24, padding: "10px 16px",
          background: "white", borderRadius: 12,
          border: "1.5px solid #DDE8E7",
          width: "fit-content",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#7A8FA6", letterSpacing: .5 }}>
            DEPARTMENT
          </span>
          {["PP", "P"].map(d => (
            <div key={d}
              onClick={() => setDept(d)}
              style={{
                padding: "7px 22px", borderRadius: 9, cursor: "pointer",
                fontWeight: 700, fontSize: 14, transition: "all .15s",
                background: dept === d ? "#2CB5A8" : "#F0F7F6",
                color: dept === d ? "white" : "#7A8FA6",
                boxShadow: dept === d ? "0 2px 8px rgba(44,181,168,.3)" : "none",
              }}>
              {d === "PP" ? "PP Classes" : "P Classes"}
            </div>
          ))}
          <span style={{
            fontSize: 11, color: "#7A8FA6", marginLeft: 4,
            background: "#F0F7F6", borderRadius: 6, padding: "3px 8px",
          }}>
            {classes.length} classes
          </span>
        </div>

        {page === "dashboard" && <AdminDashboard onNav={handleNav} classes={classes} dept={dept} />}
        {page === "materials" && <MaterialsPage role="admin" initialCatId={pageCtx.catId} classes={classes} />}
        {page === "teachers"  && <TeachersPage dept={dept} classes={classes} />}
        {page === "reports"   && <ReportsPage role="admin" classes={classes} dept={dept} />}
      </div>
    </div>
  );
}