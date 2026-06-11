import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FileText,
  Home,
  Sparkles,
  TrendingUp,
  ChartColumnBig,
  MapPin,
  BedDouble,
  Ruler,
  RefreshCw,
  Trash2
} from "lucide-react";
import MarketTrendChart from "../components/MarketTrendChart";
import DNARadarChart from "../components/DNARadarChart";
import RecentPredictions from "../components/RecentPredictions";
import DNAGauge from "../components/DNAGauge";
import { useUser } from "../../utils/UserContext";
import { getUserByEmail, getUserStatsByEmail, getPredictionsByEmail, getPortfolioByEmail, resetUserDataByEmail } from "../../utils/api";
import { useBackendRefresh, notifyBackendRefresh } from "../../utils/useBackendRefresh";
import { countries } from "../../utils/constants.js";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const getCountryMeta = (country) =>
  countries.find((item) => item.name === country) || countries.find((item) => item.name === "United States") || countries[0];

const fmtMoney = (value, country) => {
  const meta = getCountryMeta(country);
  return `${meta.symbol}${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

function buildTopLocations(predictions, overallAvgPrice) {
  const buckets = new Map();
  predictions.forEach((item) => {
    const key = [item.city, item.state, item.country].filter(Boolean).join(", ") || "Unknown";
    if (!buckets.has(key)) buckets.set(key, { prices: [], dnas: [] });
    const bucket = buckets.get(key);
    if (item.predicted_price != null) bucket.prices.push(Number(item.predicted_price) || 0);
    if (item.dna_score != null) bucket.dnas.push(Number(item.dna_score) || 0);
  });

  return [...buckets.entries()]
    .map(([location, values]) => {
      const avgPrice = values.prices.length ? values.prices.reduce((a, b) => a + b, 0) / values.prices.length : 0;
      const avgDna = values.dnas.length ? values.dnas.reduce((a, b) => a + b, 0) / values.dnas.length : 0;
      const growth = overallAvgPrice ? ((avgPrice - overallAvgPrice) / overallAvgPrice) * 100 : 0;
      return { location, growth, avgDna, investmentScore: Math.max(0, Math.min(10, avgDna / 10 + 3)) };
    })
    .sort((a, b) => b.investmentScore - a.investmentScore)
    .slice(0, 4);
}

export default function DashboardHome() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      getUserByEmail(user.email),
      getUserStatsByEmail(user.email),
      getPredictionsByEmail(user.email),
      getPortfolioByEmail(user.email),
    ])
      .then(([profileData, statsData, predictionData, portfolioData]) => {
        console.log("DashboardHome - profile:", profileData);
        console.log("DashboardHome - stats:", statsData);
        console.log("DashboardHome - predictions:", predictionData);
        console.log("DashboardHome - portfolio:", portfolioData);
        setProfile(profileData.user);
        setStats(statsData);
        setPredictions(predictionData);
        setPortfolio(portfolioData);
        setLatestPrediction(predictionData?.[0] || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  const handleRefresh = () => {
    notifyBackendRefresh();
  };

  const handleDeleteAllData = async () => {
    if (window.confirm("Are you sure you want to delete all your saved predictions, portfolio properties, favorites, and saved reports? This action cannot be undone.")) {
      try {
        setLoading(true);
        await resetUserDataByEmail(user.email);
        notifyBackendRefresh();
        alert("All user data has been successfully deleted.");
      } catch (err) {
        alert("Failed to delete data: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const avgPrice = Number(stats?.avg_price ?? 0);
  const portfolioValue = portfolio.reduce((s, p) => s + (Number(p.predicted_price) || 0), 0);
  const topLocations = useMemo(() => buildTopLocations(predictions, avgPrice), [predictions, avgPrice]);
  const latestLabel = [latestPrediction?.city, latestPrediction?.state, latestPrediction?.country].filter(Boolean).join(", ") || "No prediction yet";

  const bestOpportunity = useMemo(() => {
    if (!predictions.length) return null;
    const best = predictions.reduce((a, b) => ((b.dna_score ?? 0) > (a.dna_score ?? 0) ? b : a));
    const growth = avgPrice && best.predicted_price
      ? (((best.predicted_price - avgPrice) / avgPrice) * 100).toFixed(1)
      : null;
    return {
      label: [best.city, best.country].filter(Boolean).join(", "),
      dna: best.dna_score,
      growth,
    };
  }, [predictions, avgPrice]);

  const statCards = [
    { label: "Portfolio Value", value: fmtMoney(portfolioValue, portfolio[0]?.country || latestPrediction?.country), icon: Home, accent: "green", helper: `${portfolio.length} properties saved` },
    { label: "Predictions Made", value: stats?.total_predictions ?? 0, icon: TrendingUp, accent: "purple", helper: "Total analyses run" },
    { label: "Avg DNA Score", value: stats?.avg_dna_score != null ? Number(stats.avg_dna_score).toFixed(1) : "—", icon: Sparkles, accent: "orange", helper: "Across all predictions" },
    { label: "Reports Saved", value: stats?.saved_reports ?? 0, icon: FileText, accent: "blue", helper: "Stored documents" },
  ];

  if (!user) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Sign in to view your dashboard"
        description="Your property intelligence overview will appear here once connected."
        actionLabel="Sign in"
        actionTo="/#login"
      />
    );
  }

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={error}
        actionLabel="Try again"
        onAction={() => window.location.reload()}
      />
    );
  }

  const firstName = profile?.name?.split(" ")?.[0] || user.name.split(" ")[0];

  return (
    <div className="dashboard-home">
      <section className="dashboard-hero panel">
        <div className="dashboard-hero-copy">
          <p className="hero-kicker">
            <Sparkles size={14} />
            Property intelligence dashboard
          </p>
          <h2>Welcome back, {firstName}</h2>
          {bestOpportunity ? (
            <p className="hero-opportunity">
              Your best opportunity: <strong>{bestOpportunity.label}</strong>
              {bestOpportunity.dna != null && <> — DNA {Number(bestOpportunity.dna).toFixed(1)}</>}
              {bestOpportunity.growth != null && (
                <> · {Number(bestOpportunity.growth) >= 0 ? "↑" : "↓"} {Math.abs(bestOpportunity.growth)}% vs your avg</>
              )}
            </p>
          ) : (
            <p>Run your first prediction to unlock personalized insights.</p>
          )}

          <div className="hero-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <Link to="/dashboard/property-dna-reports" className="inline-link">View DNA Report <ArrowRight size={14} /></Link>
            
            <button 
              type="button" 
              className="inline-link" 
              onClick={handleRefresh}
              style={{ cursor: "pointer" }}
            >
              <RefreshCw size={14} /> Refresh Data
            </button>

            <button 
              type="button" 
              className="inline-link" 
              onClick={handleDeleteAllData}
              style={{ 
                cursor: "pointer", 
                color: "#ef4444", 
                borderColor: "#fee2e2",
                background: "linear-gradient(180deg, #fff, #fff5f5)" 
              }}
            >
              <Trash2 size={14} /> Delete All Data
            </button>
          </div>
        </div>
      </section>

      <div className="dashboard-stat-grid">
        {statCards.map(({ label, value, icon: Icon, accent, helper }) => (
          <div className={`card metric-card card-accent card-accent--${accent}`} key={label}>
            <div>
              <span>{label}</span>
              <strong className="stat-value-lg">{value}</strong>
              <span className="metric-helper">{helper}</span>
            </div>
            <Icon size={22} />
          </div>
        ))}
      </div>

      <div className="dashboard-shell">
        <div className="dashboard-main-column">
          <div className="dashboard-inline-grid dashboard-inline-grid--top">
            <section className="card dashboard-card dashboard-card--recent">
              <div className="section-header">
                <h3>Recent Property Prediction</h3>
                <Link className="inline-link" to="/dashboard/prediction-history">View All</Link>
              </div>

              {latestPrediction ? (
                <div className="property-preview-card">
                  <div className="property-preview-flag">
                    <MapPin size={20} />
                  </div>
                  <div className="property-preview-body">
                    <h3>{latestLabel}</h3>
                    <p>{latestPrediction.state || "Unknown state"}</p>
                    <div className="property-preview-metrics">
                      <DNAGauge score={latestPrediction.dna_score} size={72} label="DNA" />
                      <div>
                        <span className="property-preview-label">Estimated Price</span>
                        <strong className="property-preview-price">
                          {fmtMoney(latestPrediction.predicted_price, latestPrediction.country)}
                        </strong>
                        <div className="property-preview-chips">
                          {latestPrediction.rooms != null && <span><BedDouble size={13} /> {latestPrediction.rooms} bed</span>}
                          {latestPrediction.size_sqft != null && <span><Ruler size={13} /> {Number(latestPrediction.size_sqft).toLocaleString()} sqft</span>}
                          {latestPrediction.predicted_age != null && <span>Age {latestPrediction.predicted_age} yrs</span>}
                        </div>
                        <div className="property-preview-actions">
                          <Link to="/dashboard/property-dna-reports" className="inline-link">Full report</Link>
                          <Link to="/dashboard/property-portfolio" className="inline-link">Portfolio</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No predictions yet"
                  description="Run your first analysis to see it here."
                  actionLabel="New Prediction"
                  actionTo="/dashboard/new-prediction"
                />
              )}
            </section>

            <DNARadarChart />
          </div>

          <div className="dashboard-inline-grid dashboard-inline-grid--bottom">
            <section className="table-card dashboard-card dashboard-card--locations">
              <div className="section-header">
                <h3>Top Performing Locations</h3>
                <Link className="inline-link" to="/dashboard/insights?tab=country">View All</Link>
              </div>
              {topLocations.length === 0 ? (
                <EmptyState title="No location data yet" description="Predict properties in different cities to populate this table." />
              ) : (
                <table className="prediction-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Price Growth</th>
                      <th>DNA</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLocations.map((row) => (
                      <tr key={row.location}>
                        <td>{row.location}</td>
                        <td style={{ color: row.growth >= 0 ? "#0f8b52" : "#dc2626", fontWeight: 700 }}>
                          {row.growth >= 0 ? "↑" : "↓"} {Math.abs(row.growth).toFixed(1)}%
                        </td>
                        <td>{row.avgDna.toFixed(1)}</td>
                        <td>{row.investmentScore.toFixed(1)}/10</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          <RecentPredictions />
        </div>

        <aside className="dashboard-rail">
          <section className="chart-card dashboard-card dashboard-card--trend">
            <div className="section-header">
              <h3>Market Trend</h3>
              <Link to="/dashboard/insights" className="inline-link">Insights</Link>
            </div>
            <MarketTrendChart />
          </section>
        </aside>
      </div>
    </div>
  );
}
