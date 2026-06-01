import { useState } from "react";
import { AppSidebar } from "../../components/UI";
import { useAuth } from "../../contexts/AuthContext";
import { logoutUser } from "../../firebase/services";
import AdminDashboard from "./AdminDashboard";
import MaterialsPage from "./MaterialsPage";
import TeachersPage from "./TeachersPage";
import ReportsPage from "./ReportsPage";

export default function AdminLayout() {
  const { profile } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [pageCtx, setPageCtx] = useState({});

  const handleNav = (id, ctx = {}) => { setPage(id); setPageCtx(ctx); };
  const handleLogout = () => logoutUser();

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
        {page === "dashboard" && <AdminDashboard onNav={handleNav} />}
        {page === "materials" && <MaterialsPage role="admin" initialCatId={pageCtx.catId} />}
        {page === "teachers"  && <TeachersPage />}
        {page === "reports"   && <ReportsPage role="admin" />}
      </div>
    </div>
  );
}
