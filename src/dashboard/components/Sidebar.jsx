import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  History,
  Building2,
  FileText,
  Bookmark,
  Heart,
  ChartColumnBig,
  UserRound,
  Settings2,
  X,
} from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { useDashboard } from "../context/DashboardContext";

const NAV_GROUPS = [
  {
    label: "Workspace",
    links: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/dashboard/prediction-history", label: "Prediction History", icon: History },
      { to: "/dashboard/property-portfolio", label: "Property Portfolio", icon: Building2 },
    ],
  },
  {
    label: "Insights",
    links: [
      { to: "/dashboard/property-dna-reports", label: "DNA Analysis", icon: FileText },
      { to: "/dashboard/insights", label: "Market Insights", icon: ChartColumnBig },
    ],
  },
  {
    label: "Library",
    links: [
      { to: "/dashboard/saved-reports", label: "My Saved Reports", icon: Bookmark },
      { to: "/dashboard/favorites", label: "Watchlist", icon: Heart },
    ],
  },
  {
    label: "Account",
    links: [
      { to: "/dashboard/profile", label: "My Profile", icon: UserRound },
      { to: "/dashboard/settings", label: "Settings", icon: Settings2 },
    ],
  },
];

export default function Sidebar() {
  const { user } = useUser();
  const { sidebarOpen, setSidebarOpen } = useDashboard();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "PD";

  return (
    <>
      <div
        className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark sidebar-brand-mark--logo">
            <img src="/logo.png" alt="PropertyDNA logo" className="sidebar-brand-logo" />
          </div>
          <div>
            <h2>PropertyDNA</h2>
            <span>Property intelligence dashboard</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav-grouped">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="sidebar-group">
              <p className="sidebar-group-label">{group.label}</p>
              <div className="sidebar-nav">
                {group.links.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
