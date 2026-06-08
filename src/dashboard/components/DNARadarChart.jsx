import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ScanLine } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getUserStatsByEmail } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";

export default function DNARadarChart() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getUserStatsByEmail(user.email)
      .then((stats) => {
        const dna = stats.avg_dna_score || 0;
        setData([
          { subject: "DNA Score", score: Math.min(100, dna) },
          { subject: "Predictions", score: Math.min(100, (stats.total_predictions || 0) * 5) },
          { subject: "Countries", score: Math.min(100, (stats.countries_analyzed || 0) * 15) },
          { subject: "Portfolio", score: Math.min(100, (stats.portfolio_count || 0) * 10) },
          { subject: "Reports", score: Math.min(100, (stats.saved_reports || 0) * 10) },
          { subject: "Favorites", score: Math.min(100, (stats.favorites || 0) * 10) },
        ]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  return (
    <div className="chart-card">
      <div className="section-header">
        <div>
          <p className="section-kicker">
            <ScanLine size={14} />
            AI profile
          </p>
          <h3>PropertyDNA Analysis</h3>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : !data ? (
        <p className="empty-state">No data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <Radar dataKey="score" stroke="#16a34a" fill="#16a34a" fillOpacity={0.45} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
