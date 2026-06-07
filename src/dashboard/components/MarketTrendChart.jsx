import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getPredictions } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { countries } from "../../utils/constants.js";

const getCountryMeta = (country) =>
  countries.find((c) => c.name === country) || countries[0];

export default function MarketTrendChart() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("weekly");
  const [primaryCountry, setPrimaryCountry] = useState("United States");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getPredictions(user.id)
      .then((preds) => {
        if (preds.length === 0) {
          setData([]);
          setPrimaryCountry("United States");
          return;
        }

        // Determine primary country (most common)
        const countryCounts = {};
        preds.forEach(p => {
          const country = p.country || "Unknown";
          countryCounts[country] = (countryCounts[country] || 0) + 1;
        });
        const primary = Object.keys(countryCounts).reduce((a, b) => 
          countryCounts[a] > countryCounts[b] ? a : b
        ) || "United States";
        setPrimaryCountry(primary);

        // Sort by date
        const sorted = [...preds].sort((a, b) => {
          const dateA = new Date(a.created_at || new Date());
          const dateB = new Date(b.created_at || new Date());
          return dateA - dateB;
        });

        // Group by time period
        const byMonth = {};
        sorted.forEach((p) => {
          if (!p.created_at || !p.predicted_price) return;
          const date = new Date(p.created_at);
          let key;

          if (timeRange === "weekly") {
            const week = Math.floor(date.getDate() / 7);
            key = `Week ${week + 1}`;
          } else if (timeRange === "monthly") {
            key = date.toLocaleString("default", { month: "short", year: "2-digit" });
          } else {
            key = date.getFullYear().toString();
          }

          if (!byMonth[key]) {
            byMonth[key] = { name: key, prices: [], dnas: [] };
          }

          if (p.predicted_price) byMonth[key].prices.push(p.predicted_price);
          if (p.dna_score !== null && p.dna_score !== undefined) byMonth[key].dnas.push(p.dna_score);
        });

        // Calculate averages
        const trend = Object.values(byMonth).map((item) => ({
          name: item.name,
          price: item.prices.length ? Math.round(item.prices.reduce((a, b) => a + b, 0) / item.prices.length) : 0,
          dna: item.dnas.length ? Number((item.dnas.reduce((a, b) => a + b, 0) / item.dnas.length).toFixed(1)) : 0,
          }));

        setData(trend);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, refreshTick, timeRange]);

  return (
    <>
      {loading ? (
        <div className="saas-card saas-card--chart">
          <div className="saas-card-header">
            <h3>Market Trend</h3>
          </div>
          <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>Loading...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="saas-card saas-card--chart">
          <div className="saas-card-header">
            <h3>Market Trend</h3>
          </div>
          <div className="saas-chart-placeholder">
            <div style={{ textAlign: "center", color: "#64748B" }}>
              <TrendingUp size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
              <p style={{ margin: "0 0 4px" }}>No trend data available</p>
              <p style={{ margin: 0, fontSize: "12px" }}>Make predictions to see market trends</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="saas-card saas-card--chart">
          <div className="saas-card-header">
            <h3>Market Trend</h3>
            <div className="saas-filters">
              <button className={`saas-filter-btn ${timeRange === "weekly" ? "active" : ""}`} onClick={() => setTimeRange("weekly")}>
                Weekly
              </button>
              <button className={`saas-filter-btn ${timeRange === "monthly" ? "active" : ""}`} onClick={() => setTimeRange("monthly")}>
                Monthly
              </button>
              <button className={`saas-filter-btn ${timeRange === "yearly" ? "active" : ""}`} onClick={() => setTimeRange("yearly")}>
                Yearly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748B" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                }}
                formatter={(value, name) => {
                  if (name === "Avg Price") {
                    const meta = getCountryMeta(primaryCountry);
                    return [`${meta.symbol}${value.toLocaleString()}`, "Avg Price"];
                  }
                  return [value, "DNA Score"];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "16px" }} />
              <Line type="monotone" dataKey="price" stroke="#22C55E" dot={{ fill: "#22C55E", r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} name="Avg Price" />
              <Line type="monotone" dataKey="dna" stroke="#7C3AED" dot={{ fill: "#7C3AED", r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} name="DNA Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
