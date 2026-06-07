import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Globe2 } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getPredictions } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#06b6d4"];

export default function CountryPieChart() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getPredictions(user.id)
      .then((preds) => {
        const counts = {};
        preds.forEach((p) => {
          const c = p.country || "Unknown";
          counts[c] = (counts[c] || 0) + 1;
        });
        setData(Object.entries(counts).map(([name, value]) => ({ name, value })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  return (
    <div className="chart-card">
      {/* Section header hidden for market insights view */}

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <p>No country data yet.</p>
          <p>Make predictions to see your distribution.</p>
        </div>
      ) : (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                outerRadius={60}
                label={data.length > 1 ? ({ name }) => name : false}
                isAnimationActive={true}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.name === "India" ? "#f59e0b" : COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              {data.length > 1 && <Legend />}
            </PieChart>
          </ResponsiveContainer>
          {data.length === 1 && (
            <div style={{ marginTop: "16px", textAlign: "center", fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>
              <span style={{ color: "#f59e0b", marginRight: "6px" }}>■</span>
              {data[0].name} - 100%
            </div>
          )}
        </div>
      )}
    </div>
  );
}
