import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getPredictionsByEmail } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { formatCurrency } from "../../utils/formatCurrency";

export default function CountryInsights() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getPredictionsByEmail(user.email)
      .then((preds) => {
        const map = {};
        preds.forEach((p) => {
          const c = p.country || "Unknown";
          if (!map[c]) map[c] = { prices: [], dnas: [] };
          if (p.predicted_price) map[c].prices.push(p.predicted_price);
          if (p.dna_score != null) map[c].dnas.push(p.dna_score);
        });
        const result = Object.entries(map).map(([country, { prices, dnas }]) => ({
          country,
          predictions: prices.length,
          avg_price: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
          avg_dna: dnas.length ? dnas.reduce((a, b) => a + b, 0) / dnas.length : 0,
        }));
        result.sort((a, b) => b.predictions - a.predictions);
        setInsights(result);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  if (!user) {
    return <div className="page-empty"><h2>Sign in to view country insights.</h2></div>;
  }

  if (loading) {
    return <div className="page-empty"><p>Loading...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-kicker">
            <Globe2 size={14} />
            Geographic view
          </p>
          <h2 className="page-title">Country Insights</h2>
          <p className="page-subtitle">Country-level performance.</p>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="empty-state-card">
          <h3>No country data yet</h3>
          <p>Make predictions across different countries to see insights here.</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="prediction-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Predictions</th>
                <th>Avg Price</th>
                <th>Avg DNA Score</th>
              </tr>
            </thead>
            <tbody>
              {insights.map((item) => (
                <tr key={item.country}>
                  <td>{item.country}</td>
                  <td>{item.predictions}</td>
                  <td>{formatCurrency(item.avg_price, item.country)}</td>
                  <td>{Number(item.avg_dna).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
