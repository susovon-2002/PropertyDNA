import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export default function DashboardFAB() {
  return (
    <Link to="/dashboard/new-prediction" className="dashboard-fab" aria-label="New prediction">
      <Plus size={22} />
    </Link>
  );
}
