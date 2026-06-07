import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Menu, Plus, ChevronRight } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { useDashboard } from "../context/DashboardContext";
import { getPageMeta } from "../utils/pageMeta";

export default function Topbar() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, setSidebarOpen, notifications, dismissNotification } = useDashboard();

  const meta = getPageMeta(location.pathname);
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "PD";

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-icon-btn topbar-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <nav className="topbar-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          {meta.section && meta.section !== "Workspace" && (
            <>
              <ChevronRight size={14} />
              <span>{meta.section}</span>
            </>
          )}
          <ChevronRight size={14} />
          <span className="breadcrumb-current">{meta.title}</span>
        </nav>
      </div>

      <div className="topbar-search">
        <Search size={18} />
        <input
          type="search"
          placeholder="Search predictions, cities, countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search dashboard"
        />
        <span className="topbar-search-shortcut">⌘K</span>
      </div>

      <div className="topbar-actions">
        <div className="topbar-notify-wrap">
          <button type="button" className="topbar-icon-btn" aria-label="Notifications">
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="topbar-notify-badge">{notifications.length}</span>
            )}
          </button>
          {notifications.length > 0 && (
            <div className="topbar-notify-panel">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notify-item notify-item--${n.type}`}
                  onClick={() => dismissNotification(n.id)}
                >
                  {n.message}
                </button>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <button
            type="button"
            className="topbar-user"
            onClick={() => navigate("/dashboard/profile")}
          >
            <span className="topbar-avatar">{initials}</span>
            <span className="topbar-user-meta">
              <strong>{user.name.split(" ")[0]}</strong>
              <span>{user.email}</span>
            </span>
          </button>
        ) : (
          <Link to="/#login" className="topbar-signout-btn">Sign in</Link>
        )}
      </div>
    </div>
  );
}
