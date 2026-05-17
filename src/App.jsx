import { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GLOBAL_CSS } from "./utils/theme";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import TeacherLayout from "./pages/teacher/TeacherLayout";
import { Spinner } from "./components/UI";

function InjectCSS() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

function AppInner() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user || !profile) return <LoginPage />;
  if (profile.role === "admin")   return <AdminLayout />;
  if (profile.role === "teacher") return <TeacherLayout />;
  return <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <InjectCSS />
      <AppInner />
    </AuthProvider>
  );
}
