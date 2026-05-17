import { useState } from "react";
import { AppSidebar } from "../../components/UI";
import { useAuth } from "../../contexts/AuthContext";
import { logoutUser } from "../../firebase/services";
import MaterialsPage from "../admin/MaterialsPage";
import ReportsPage from "../admin/ReportsPage";

export default function TeacherLayout() {
  const { profile } = useAuth();
  const [page, setPage] = useState("myclass");

  const handleNav = (id) => setPage(id);
  const handleLogout = () => logoutUser();

  return (
    <div>
      <AppSidebar
        role="teacher"
        active={page}
        onNav={handleNav}
        onLogout={handleLogout}
        name={profile?.name || "Teacher"}
        className={profile?.className || ""}
      />
      <div className="main">
        {page === "myclass" && (
          <MaterialsPage
            role="teacher"
            classFilter={profile?.className}
          />
        )}
        {page === "reports" && (
          <ReportsPage
            role="teacher"
            classFilter={profile?.className}
          />
        )}
      </div>
    </div>
  );
}
