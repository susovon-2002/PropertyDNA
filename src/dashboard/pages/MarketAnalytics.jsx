import { useEffect, useState } from "react";
import { ChartColumnBig, Globe2, BadgeDollarSign, FileText } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getUserStats, getPredictions } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { formatCurrency } from "../../utils/formatCurrency";

export default function MarketAnalytics() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [stats, setStats] = useState(null);
  const [topCountry, setTopCountry] = useState("—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    Promise.all([getUserStats(user.id), getPredictions(user.id)])
      .then(([s, preds]) => {
        setStats(s);
        const counts = {};
        preds.forEach((p) => {
          if (p.country) counts[p.country] = (counts[p.country] || 0) + 1;
        });
        const top = Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
        setTopCountry(top ? top[0] : "—");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  if (!user) {
    return <div className="page-empty"><h2>Sign in to view market analytics.</h2></div>;
  }

  if (loading) {
    return <div className="page-empty"><p>Loading...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-kicker">
            <ChartColumnBig size={14} />
            Market signals
          </p>
          <h2 className="page-title">Market Analytics</h2>
          <p className="page-subtitle">Based on your {stats?.total_predictions ?? 0} predictions</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="stat-card-head"><BadgeDollarSign size={18} /><h4>Avg Property Price</h4></div>
          <h2>{stats ? formatCurrency(stats.avg_price, topCountry) : "—"}</h2>
        </div>
        <div className="card">
          <div className="stat-card-head"><ChartColumnBig size={18} /><h4>Avg DNA Score</h4></div>
          <h2>{stats ? Number(stats.avg_dna_score).toFixed(1) : "—"}</h2>
        </div>
        <div className="card">
          <div className="stat-card-head"><ChartColumnBig size={18} /><h4>Total Predictions</h4></div>
          <h2>{stats?.total_predictions ?? 0}</h2>
        </div>
        <div className="card">
          <div className="stat-card-head"><Globe2 size={18} /><h4>Top Country</h4></div>
          <h2>{topCountry}</h2>
        </div>
        <div className="card">
          <div className="stat-card-head"><Globe2 size={18} /><h4>Countries Analyzed</h4></div>
          <h2>{stats?.countries_analyzed ?? 0}</h2>
        </div>
        <div className="card">
          <div className="stat-card-head"><FileText size={18} /><h4>Saved Reports</h4></div>
          <h2>{stats?.saved_reports ?? 0}</h2>
        </div>
      </div>

      {stats?.total_predictions === 0 && (
        <div className="empty-state-card" style={{ marginTop: "2rem" }}>
          <h3>No data yet</h3>
          <p>Make predictions to generate your personal market analytics.</p>
        </div>
      )}
    </div>
  );
}
