import { useEffect, useState } from "react";
import { Lightbulb, Award, Globe2, BadgeDollarSign, ChartColumnBig } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getPredictionsByEmail } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { formatCurrency } from "../../utils/formatCurrency";

export default function InvestmentAdvisor() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getPredictionsByEmail(user.email)
      .then((preds) => {
        if (!preds.length) {
          setAdvice(null);
          setLoading(false);
          return;
        }

        const best = preds.reduce((a, b) => ((b.dna_score ?? 0) > (a.dna_score ?? 0) ? b : a));
        const avgDna = preds.reduce((s, p) => s + (p.dna_score ?? 0), 0) / preds.length;
        const grade =
          avgDna >= 90 ? "A+" :
          avgDna >= 80 ? "A" :
          avgDna >= 70 ? "B+" :
          avgDna >= 60 ? "B" :
          avgDna >= 50 ? "C" : "D";

        const byCountry = {};
        preds.forEach((p) => {
          if (!p.country) return;
          if (!byCountry[p.country]) byCountry[p.country] = [];
          byCountry[p.country].push(p.dna_score ?? 0);
        });
        const topCountry = Object.entries(byCountry)
          .map(([c, d]) => [c, d.reduce((a, b) => a + b, 0) / d.length])
          .sort(([, a], [, b]) => b - a)[0];

        const avgPrice = preds.reduce((s, p) => s + (p.predicted_price ?? 0), 0) / preds.length;

        setAdvice({
          bestCity: [best.city, best.country].filter(Boolean).join(", ") || "—",
          bestDna: Number(best.dna_score ?? 0).toFixed(1),
          grade,
          avgDna: Number(avgDna).toFixed(1),
          topCountry: topCountry ? topCountry[0] : "—",
          topCountryDna: topCountry ? Number(topCountry[1]).toFixed(1) : "—",
          avgPrice,
          totalPreds: preds.length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  if (!user) {
    return <div className="page-empty"><h2>Sign in to view investment advice.</h2></div>;
  }

  if (loading) {
    return <div className="page-empty"><p>Loading...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-kicker">
            <Lightbulb size={14} />
            Decision support
          </p>
          <h2 className="page-title">Investment Advisor</h2>
          <p className="page-subtitle">Prediction-based insights.</p>
        </div>
      </div>

      {!advice ? (
        <div className="empty-state-card">
          <h3>No investment data yet</h3>
          <p>Make at least one prediction to get personalised investment advice.</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="card">
            <div className="stat-card-head"><Award size={18} /><h4>Best Location</h4></div>
            <h2 style={{ fontSize: "1.2rem" }}>{advice.bestCity}</h2>
            <p>DNA Score: {advice.bestDna}</p>
          </div>
          <div className="card">
            <div className="stat-card-head"><ChartColumnBig size={18} /><h4>Investment Grade</h4></div>
            <h2 className="grade-badge">{advice.grade}</h2>
            <p>Avg DNA: {advice.avgDna}/100</p>
          </div>
          <div className="card">
            <div className="stat-card-head"><Globe2 size={18} /><h4>Top Country</h4></div>
            <h2 style={{ fontSize: "1.3rem" }}>{advice.topCountry}</h2>
            <p>Avg DNA: {advice.topCountryDna}</p>
          </div>
          <div className="card">
            <div className="stat-card-head"><BadgeDollarSign size={18} /><h4>Average Portfolio Value</h4></div>
            <h2>{formatCurrency(advice.avgPrice, advice.topCountry)}</h2>
            <p>Across {advice.totalPreds} prediction{advice.totalPreds !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}
