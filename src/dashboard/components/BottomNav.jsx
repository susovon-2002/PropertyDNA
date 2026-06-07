import { NavLink } from "react-router-dom";
import { LayoutDashboard, Sparkles, Building2, ChartColumnBig } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/dashboard/new-prediction", label: "Predict", icon: Sparkles },
  { to: "/dashboard/property-portfolio", label: "Portfolio", icon: Building2 },
  { to: "/dashboard/insights", label: "Insights", icon: ChartColumnBig },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `bottom-nav-link${isActive ? " active" : ""}`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
