import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  Globe2,
  Heart,
  FileText,
  Sparkles,
} from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getUserStats } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";

const CARD_DEFS = [
  { key: "total_predictions", label: "Total Predictions", icon: Sparkles, format: (v) => v },
  { key: "avg_price", label: "Average Property Value", icon: BadgeDollarSign, format: (v) => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
  { key: "avg_dna_score", label: "Average DNA Score", icon: ChartNoAxesCombined, format: (v) => Number(v).toFixed(1) },
  { key: "countries_analyzed", label: "Countries Analyzed", icon: Globe2, format: (v) => v },
  { key: "saved_reports", label: "Saved Reports", icon: FileText, format: (v) => v },
  { key: "favorites", label: "Favorites", icon: Heart, format: (v) => v },
];

export default function KPICards() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getUserStats(user.id)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  if (!user) {
    return (
      <div className="kpi-grid">
        <div className="kpi-card empty-kpi">
          <p>Sign in to view your analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="kpi-grid">
        {CARD_DEFS.map((_, i) => (
          <div key={i} className="kpi-card kpi-skeleton">
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="kpi-grid">
        <div className="kpi-card error-card">
          <p>Failed to load stats: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {CARD_DEFS.map(({ key, label, icon: Icon, format }) => (
        <div key={key} className="kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-icon">
              <Icon size={18} />
            </span>
            <h4>{label}</h4>
          </div>
          <h2>{stats ? format(stats[key] ?? 0) : "—"}</h2>
        </div>
      ))}
    </div>
  );
}
