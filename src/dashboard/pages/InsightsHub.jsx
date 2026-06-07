import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChartColumnBig,
  Globe2,
  Lightbulb,
  Award,
  BadgeDollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  MapPin,
  Download,
  Calendar,
  Home,
  TrendingUp as Trend,
  PieChart,
  Filter,
  Zap,
  AlertCircle,
} from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CountryPieChart from "../components/CountryPieChart";
import MarketTrendChart from "../components/MarketTrendChart";
import { useUser } from "../../utils/UserContext";
import { getUserStats, getPredictions } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { countries } from "../../utils/constants.js";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const TABS = [
  { id: "overview", label: "Overview", icon: ChartColumnBig },
  { id: "country", label: "By Country", icon: Globe2 },
  { id: "advisor", label: "Investment Picks", icon: Lightbulb },
];

const getCountryMeta = (country) =>
  countries.find((c) => c.name === country) || countries[0];

const fmtMoney = (value, country = "United States") => {
  const meta = getCountryMeta(country);
  const formattedValue = Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `${meta.symbol}${formattedValue}`;
};

export default function InsightsHub() {
  const { user } = useUser();
  const refreshTick = useBackendRefresh();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";

  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getUserStats(user.id), getPredictions(user.id)])
      .then(([s, preds]) => {
        setStats(s);
        setPredictions(preds);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  const setTab = (id) => setSearchParams({ tab: id });

  // Calculate trends
  const trendData = useMemo(() => {
    if (!predictions.length) return { priceChange: 0, dnaChange: 0, priceDir: "stable", dnaDir: "stable" };
    
    const sorted = [...predictions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recent = sorted.slice(0, Math.ceil(sorted.length / 2));
    const older = sorted.slice(Math.ceil(sorted.length / 2));
    
    const recentPrice = recent.reduce((s, p) => s + (p.predicted_price ?? 0), 0) / recent.length;
    const olderPrice = older.reduce((s, p) => s + (p.predicted_price ?? 0), 0) / older.length;
    const priceChange = olderPrice ? ((recentPrice - olderPrice) / olderPrice) * 100 : 0;
    
    const recentDna = recent.reduce((s, p) => s + (p.dna_score ?? 0), 0) / recent.length;
    const olderDna = older.reduce((s, p) => s + (p.dna_score ?? 0), 0) / older.length;
    const dnaChange = olderDna ? ((recentDna - olderDna) / olderDna) * 100 : 0;
    
    return {
      priceChange: Math.abs(priceChange),
      dnaChange: Math.abs(dnaChange),
      priceDir: priceChange >= 0 ? "up" : "down",
      dnaDir: dnaChange >= 0 ? "up" : "down",
    };
  }, [predictions]);

  // Correlation chart data
  const correlationData = useMemo(() => {
    return predictions
      .filter(p => p.predicted_price && p.dna_score != null)
      .map(p => ({
        price: p.predicted_price,
        dna: p.dna_score,
        country: p.country,
      }))
      .slice(0, 100);
  }, [predictions]);

  // Get primary country for currency formatting
  const primaryCountry = useMemo(() => {
    if (correlationData.length === 0) return "United States";
    // Count occurrences of each country and return the most common
    const countryCounts = {};
    correlationData.forEach(item => {
      countryCounts[item.country] = (countryCounts[item.country] || 0) + 1;
    });
    return Object.keys(countryCounts).reduce((a, b) => 
      countryCounts[a] > countryCounts[b] ? a : b
    ) || "United States";
  }, [correlationData]);

  const countryInsights = (() => {
    const map = {};
    predictions.forEach((p) => {
      const c = p.country || "Unknown";
      if (!map[c]) map[c] = { prices: [], dnas: [], count: 0 };
      map[c].count += 1;
      if (p.predicted_price) map[c].prices.push(p.predicted_price);
      if (p.dna_score != null) map[c].dnas.push(p.dna_score);
    });
    return Object.entries(map)
      .map(([country, { prices, dnas, count }]) => ({
        country,
        predictions: count,
        avg_price: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        avg_dna: dnas.length ? dnas.reduce((a, b) => a + b, 0) / dnas.length : 0,
      }))
      .sort((a, b) => b.predictions - a.predictions);
  })();

  const advice = (() => {
    if (!predictions.length) return null;
    const best = predictions.reduce((a, b) => ((b.dna_score ?? 0) > (a.dna_score ?? 0) ? b : a));
    const avgDna = predictions.reduce((s, p) => s + (p.dna_score ?? 0), 0) / predictions.length;
    const grade =
      avgDna >= 90 ? "A+" : avgDna >= 80 ? "A" : avgDna >= 70 ? "B+" : avgDna >= 60 ? "B" : avgDna >= 50 ? "C" : "D";
    const byCountry = {};
    predictions.forEach((p) => {
      if (!p.country) return;
      if (!byCountry[p.country]) byCountry[p.country] = [];
      byCountry[p.country].push(p.dna_score ?? 0);
    });
    const topCountry = Object.entries(byCountry)
      .map(([c, d]) => [c, d.reduce((a, b) => a + b, 0) / d.length])
      .sort(([, a], [, b]) => b - a)[0];
    const avgPrice = predictions.reduce((s, p) => s + (p.predicted_price ?? 0), 0) / predictions.length;
    
    // Real investment signal calculation
    const highQuality = predictions.filter(p => (p.dna_score ?? 0) >= 75).length;
    const highQualityPct = (highQuality / predictions.length) * 100;
    
    return {
      bestCity: [best.city, best.country].filter(Boolean).join(", ") || "—",
      bestDna: Number(best.dna_score ?? 0).toFixed(1),
      grade,
      avgDna: Number(avgDna).toFixed(1),
      topCountry: topCountry ? topCountry[0] : "—",
      topCountryDna: topCountry ? Number(topCountry[1]).toFixed(1) : "—",
      avgPrice,
      totalPreds: predictions.length,
      highQualityPct: Math.round(highQualityPct),
      picks: predictions
        .filter((p) => (p.dna_score ?? 0) >= 60)
        .sort((a, b) => (b.dna_score ?? 0) - (a.dna_score ?? 0))
        .slice(0, 5)
        .map((p) => ({
          location: [p.city, p.country].filter(Boolean).join(", "),
          dna: p.dna_score,
          price: p.predicted_price,
          country: p.country,
          signal: (p.dna_score ?? 0) >= 80 ? "Buy" : (p.dna_score ?? 0) >= 65 ? "Hold" : "Watch",
        })),
    };
  })();

  if (!user) {
    return (
      <EmptyState
        icon={ChartColumnBig}
        title="Sign in to view market insights"
        description="Your personalized market analytics will appear here."
        actionLabel="Sign in"
        actionTo="/#login"
      />
    );
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="insights-hub">
      <div className="saas-header">
        <div className="saas-breadcrumb">
          <span>Dashboard</span>
          <span>/</span>
          <span>Insights</span>
          <span>/</span>
          <span className="active">Market Insights</span>
        </div>
        <div className="saas-header-actions">
          <button className="saas-btn saas-btn--outline">
            <Calendar size={16} />
            Last 30 Days
          </button>
          <button className="saas-btn saas-btn--primary">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="saas-page-title">
        <h1>Market Insights</h1>
        <p>Comprehensive analysis based on property predictions</p>
      </div>

      <div className="saas-kpi-grid">
        <div className="saas-kpi-card saas-kpi-card--green">
          <div className="saas-kpi-icon">
            <BadgeDollarSign size={24} />
          </div>
          <div className="saas-kpi-content">
            <span className="saas-kpi-label">Avg Property Price</span>
            <h3 className="saas-kpi-value">{fmtMoney(stats?.avg_price, predictions[0]?.country)}</h3>
            <div className={`saas-kpi-trend saas-kpi-trend--${trendData.priceDir}`}>
              {trendData.priceDir === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trendData.priceChange.toFixed(1)}%</span>
            </div>
          </div>
          <div className="saas-kpi-sparkline">
            <svg viewBox="0 0 60 24" fill="none">
              <path d="M0 20 L10 15 L20 18 L30 10 L40 14 L50 8 L60 12" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="saas-kpi-card saas-kpi-card--purple">
          <div className="saas-kpi-icon">
            <Activity size={24} />
          </div>
          <div className="saas-kpi-content">
            <span className="saas-kpi-label">Avg DNA Score</span>
            <h3 className="saas-kpi-value">{stats ? Number(stats.avg_dna_score).toFixed(1) : "—"}</h3>
            <div className={`saas-kpi-trend saas-kpi-trend--${trendData.dnaDir}`}>
              {trendData.dnaDir === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trendData.dnaChange.toFixed(1)}%</span>
            </div>
          </div>
          <div className="saas-kpi-sparkline">
            <svg viewBox="0 0 60 24" fill="none">
              <path d="M0 16 L10 14 L20 18 L30 12 L40 15 L50 10 L60 14" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="saas-kpi-card saas-kpi-card--blue">
          <div className="saas-kpi-icon">
            <BarChart3 size={24} />
          </div>
          <div className="saas-kpi-content">
            <span className="saas-kpi-label">Total Predictions</span>
            <h3 className="saas-kpi-value">{stats?.total_predictions ?? 0}</h3>
            <div className="saas-kpi-trend saas-kpi-trend--up">
              <TrendingUp size={14} />
              <span>Analyzed</span>
            </div>
          </div>
          <div className="saas-kpi-sparkline">
            <svg viewBox="0 0 60 24" fill="none">
              <path d="M0 18 L10 16 L20 14 L30 18 L40 12 L50 14 L60 10" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="saas-kpi-card saas-kpi-card--orange">
          <div className="saas-kpi-icon">
            <Award size={24} />
          </div>
          <div className="saas-kpi-content">
            <span className="saas-kpi-label">High Quality</span>
            <h3 className="saas-kpi-value">{advice?.highQualityPct ?? 0}%</h3>
            <div className="saas-kpi-trend saas-kpi-trend--up">
              <Sparkles size={14} />
              <span>Grade: {advice?.grade}</span>
            </div>
          </div>
          <div className="saas-kpi-sparkline">
            <svg viewBox="0 0 60 24" fill="none">
              <path d="M0 14 L10 12 L20 16 L30 10 L40 14 L50 8 L60 12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="saas-analytics-grid">
        <MarketTrendChart />
      </div>

      {correlationData.length > 0 && (
        <div className="saas-card saas-card--analytics">
          <div className="saas-card-header">
            <h3>Price vs DNA Correlation</h3>
            <p>Relationship between property valuation and quality score</p>
          </div>
          <div className="saas-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="price" 
                  name="Price" 
                  type="number"
                  tickFormatter={(v) => fmtMoney(v, primaryCountry)}
                />
                <YAxis dataKey="dna" name="DNA Score" type="number" />
                <Tooltip 
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value, name) => {
                    if (name === "Price") return fmtMoney(value, primaryCountry);
                    return Number(value).toFixed(1);
                  }}
                />
                <Scatter name="Properties" data={correlationData} fill="#7C3AED" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="saas-insights-section">
        <h2 className="saas-section-title">Market Signals</h2>
        <div className="saas-insights-grid">
          <div className="saas-insight-card saas-insight-card--green">
            <div className="saas-insight-icon">
              <TrendingUp size={24} />
            </div>
            <h4>{trendData.priceDir === "up" ? "Price Appreciation" : "Price Declining"}</h4>
            <p>{trendData.priceChange.toFixed(1)}% price trend across recent predictions</p>
          </div>

          <div className="saas-insight-card saas-insight-card--purple">
            <div className="saas-insight-icon">
              <Award size={24} />
            </div>
            <h4>Quality Grade: {advice?.grade || "—"}</h4>
            <p>Average DNA score: {advice?.avgDna || "—"} out of 100</p>
          </div>

          <div className="saas-insight-card saas-insight-card--blue">
            <div className="saas-insight-icon">
              <Zap size={24} />
            </div>
            <h4>{advice?.highQualityPct}% High Quality</h4>
            <p>{advice?.highQualityPct}% of properties score above 75 DNA</p>
          </div>

          <div className="saas-insight-card saas-insight-card--orange">
            <div className="saas-insight-icon">
              <MapPin size={24} />
            </div>
            <h4>Top Market: {advice?.topCountry || "—"}</h4>
            <p>Avg DNA score: {advice?.topCountryDna || "—"} in {advice?.topCountry || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
