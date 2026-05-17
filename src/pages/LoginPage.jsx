import { useState } from "react";
import { T } from "../utils/theme";
import { loginUser, getUserProfile } from "../firebase/services";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { setProfile } = useAuth();
  const [role, setRole]   = useState("teacher");
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErr(""); setLoading(true);
    try {
      const cred = await loginUser(email, pass);
      const prof = await getUserProfile(cred.user.uid);
      if (!prof) { setErr("Account not found. Contact admin."); setLoading(false); return; }
      if (prof.role !== role) {
        setErr(`This account is a ${prof.role}, not ${role}. Please select the correct role.`);
        setLoading(false); return;
      }
      setProfile(prof);
    } catch (e) {
      setErr("Invalid email or password.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, #E8F7F6 0%, #FEF5F0 100%)`,
      backgroundImage: "radial-gradient(circle at 70% 20%, rgba(44,181,168,.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(232,135,106,.12) 0%, transparent 50%)",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 6 }}>📋</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.slate }}>KN Materials</div>
          <div style={{ fontSize: 14, color: T.muted, marginTop: 3 }}>Stock & Material Tracker</div>
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: 32, border: `1px solid ${T.border}`, boxShadow: "0 8px 40px rgba(30,42,56,.1)" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.slate, marginBottom: 20 }}>Sign in</div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">I am a</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["teacher", "admin"].map(r => (
                <div key={r} onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: 11, borderRadius: 10, cursor: "pointer", textAlign: "center",
                    border: `2px solid ${role === r ? T.teal : T.border}`,
                    background: role === r ? "rgba(44,181,168,.08)" : "white",
                    color: role === r ? T.teal : T.muted,
                    fontWeight: 600, fontSize: 14, transition: "all .16s",
                  }}>
                  {r === "teacher" ? "👤 Teacher" : "🔑 Admin"}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={pass} onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>

            {err && (
              <div style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#C53030" }}>
                {err}
              </div>
            )}

            <button className="btn btn-primary"
              style={{ width: "100%", padding: 13, marginTop: 4, justifyContent: "center" }}
              onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : `Sign In as ${role === "teacher" ? "Teacher" : "Admin"}`}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: T.muted }}>
            Forgot your password? Contact your administrator.
          </div>
        </div>
      </div>
    </div>
  );
}
