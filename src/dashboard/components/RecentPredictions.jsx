import { useEffect, useState } from "react";
import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "../../utils/UserContext";
import { getPredictionsByEmail } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { formatCurrency } from "../../utils/formatCurrency";

export default function RecentPredictions() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getPredictionsByEmail(user.email)
      .then((data) => setPredictions(data.slice(0, 5)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  return (
    <div className="table-card recent-predictions-card">
      <div className="section-header">
        <div>
          <p className="section-kicker">
            <Clock3 size={14} />
            Latest activity
          </p>
          <h3>Recent Predictions</h3>
        </div>
        <Link to="/dashboard/prediction-history" className="inline-link">
          View all
          <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <div className="skeleton-card-inline">
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      ) : predictions.length === 0 ? (
        <div className="empty-state">
          <p>No predictions yet.</p>
          <p>Run your first analysis to see it appear here.</p>
        </div>
      ) : (
        <table className="prediction-table">
          <thead>
            <tr>
              <th>City</th>
              <th>Country</th>
              <th>Price</th>
              <th>DNA Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((item) => (
              <tr key={item.id}>
                <td>{item.city || "—"}</td>
                <td>{item.country || "—"}</td>
                <td>{formatCurrency(item.predicted_price, item.country)}</td>
                <td>{item.dna_score != null ? Number(item.dna_score).toFixed(1) : "—"}</td>
                <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
