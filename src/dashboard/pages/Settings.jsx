import { ShieldCheck, Palette, AlertTriangle, Moon, Sun, Globe2, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../utils/UserContext";
import { useDashboard } from "../context/DashboardContext";
import { countries } from "../../utils/constants.js";

export default function Settings() {
  const { user, signOut } = useUser();
  const { theme, toggleTheme } = useDashboard();
  const navigate = useNavigate();

  if (!user) {
    return <div className="page-empty"><h2>Sign in to view settings.</h2></div>;
  }

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <p className="page-kicker"><ShieldCheck size={14} /> Account settings</p>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Manage your account and preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card settings-card">
          <h3>Account Information</h3>
          <dl className="settings-dl">
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>User ID</dt><dd>{user.id}</dd></div>
          </dl>
        </div>

        <div className="card settings-card">
          <div className="stat-card-head"><Palette size={18} /><h3>Appearance</h3></div>
          <div className="settings-toggle-row">
            <div>
              <strong>Theme</strong>
              <p>Switch between light and dark mode.</p>
            </div>
            <button type="button" className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>
        </div>

        <div className="card settings-card">
          <div className="stat-card-head"><Globe2 size={18} /><h3>Regional</h3></div>
          <p className="settings-note">Supported markets: {countries.map((c) => c.name).join(", ")}.</p>
        </div>

        <div className="card settings-card">
          <div className="stat-card-head"><Bell size={18} /><h3>Notifications</h3></div>
          <p className="settings-note">In-app notifications are enabled for saves, exports, and model retraining.</p>
        </div>

        <div className="card settings-card">
          <div className="stat-card-head"><ShieldCheck size={18} /><h3>Security</h3></div>
          <p className="settings-note">Password management and two-factor authentication coming soon.</p>
        </div>

        <div className="card settings-card settings-card--danger">
          <div className="stat-card-head"><AlertTriangle size={18} /><h3>Danger Zone</h3></div>
          <button className="btn-danger" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
