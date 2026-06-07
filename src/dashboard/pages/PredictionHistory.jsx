import { useEffect, useMemo, useState } from "react";
import { History, Download, SlidersHorizontal, TrendingUp, Activity, Award, MapPin } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getPredictions, addFavorite, saveReport } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { useDashboard } from "../context/DashboardContext";
import { countries } from "../../utils/constants.js";
import PropertyDetailDrawer from "../components/PropertyDetailDrawer";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const getCountryMeta = (country) =>
  countries.find((c) => c.name === country) || countries[0];

const fmt = (v, country) => {
  const meta = getCountryMeta(country);
  return v != null ? `${meta.symbol}${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—";
};

export default function PredictionHistory() {
  const { user } = useUser();
  const { searchQuery, addNotification } = useDashboard();
  const refreshTick = useBackendRefresh();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [countryFilter, setCountryFilter] = useState("all");
  const [dnaFilterMin, setDnaFilterMin] = useState(0);
  const [priceFilterMin, setPriceFilterMin] = useState(0);
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getPredictions(user.id)
      .then(setHistory)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  const countries_list = useMemo(
    () => [...new Set(history.map((h) => h.country).filter(Boolean))],
    [history],
  );

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (!history.length) return null;
    const prices = history.map(h => h.predicted_price).filter(p => p != null);
    const dnas = history.map(h => h.dna_score).filter(d => d != null);
    
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgDna = dnas.reduce((a, b) => a + b, 0) / dnas.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const maxDna = Math.max(...dnas);
    const minDna = Math.min(...dnas);
    const highQuality = history.filter(h => (h.dna_score ?? 0) >= 75).length;
    const mediumQuality = history.filter(h => (h.dna_score ?? 0) >= 50 && (h.dna_score ?? 0) < 75).length;
    
    return {
      avgPrice,
      avgDna: avgDna.toFixed(1),
      maxPrice,
      minPrice,
      maxDna: maxDna.toFixed(1),
      minDna: minDna.toFixed(1),
      highQualityCount: highQuality,
      highQualityPct: ((highQuality / history.length) * 100).toFixed(0),
      mediumQualityPct: ((mediumQuality / history.length) * 100).toFixed(0),
      total: history.length,
    };
  }, [history]);

  const filtered = useMemo(() => {
    let rows = [...history];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (item) =>
          (item.city || "").toLowerCase().includes(q) ||
          (item.state || "").toLowerCase().includes(q) ||
          (item.country || "").toLowerCase().includes(q),
      );
    }
    if (countryFilter !== "all") {
      rows = rows.filter((item) => item.country === countryFilter);
    }
    if (dnaFilterMin > 0) {
      rows = rows.filter((item) => (item.dna_score ?? 0) >= dnaFilterMin);
    }
    if (priceFilterMin > 0) {
      rows = rows.filter((item) => (item.predicted_price ?? 0) >= priceFilterMin);
    }
    if (sortBy === "dna") rows.sort((a, b) => (b.dna_score ?? 0) - (a.dna_score ?? 0));
    else if (sortBy === "price") rows.sort((a, b) => (b.predicted_price ?? 0) - (a.predicted_price ?? 0));
    else rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return rows;
  }, [history, searchQuery, countryFilter, dnaFilterMin, priceFilterMin, sortBy]);

  const handleExport = () => {
    const header = "Date,Country,State,City,Price,DNA,Age\n";
    const body = filtered
      .map((item) =>
        [
          item.created_at ? new Date(item.created_at).toLocaleDateString() : "",
          item.country || "",
          item.state || "",
          item.city || "",
          item.predicted_price ?? "",
          item.dna_score ?? "",
          item.predicted_age ?? "",
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prediction-history.csv";
    a.click();
    URL.revokeObjectURL(url);
    addNotification("History exported to CSV", "success");
  };

  const handleFavorite = async (item) => {
    if (!user) return;
    try {
      await addFavorite(user.id, {
        city: item.city,
        state: item.state,
        country: item.country,
        dna_score: Number(item.dna_score) || 0,
        predicted_price: Number(item.predicted_price) || 0,
      });
      addNotification("Added to Watchlist ❤️", "success");
    } catch (e) {
      addNotification(e.message, "error");
    }
  };

  const handleSaveReport = async (item) => {
    if (!user) return;
    const location = [item.city, item.state, item.country].filter(Boolean).join(", ") || "Unknown";
    const reportName = `Report – ${location} (${item.created_at ? new Date(item.created_at).toLocaleDateString() : "Today"})`;
    try {
      await saveReport(user.id, {
        report_name: reportName,
        country: item.country || "",
        state: item.state || "",
        city: item.city || "",
        predicted_price: Number(item.predicted_price) || 0,
        dna_score: Number(item.dna_score) || 0,
        predicted_age: Number(item.predicted_age) || 0,
      });
      addNotification("Report saved to My Saved Reports 📄", "success");
    } catch (e) {
      addNotification("Failed to save report: " + e.message, "error");
    }
  };

  if (!user) {
    return <EmptyState icon={History} title="Sign in to view prediction history" actionLabel="Sign in" actionTo="/#login" />;
  }
  if (loading) return <PageSkeleton />;
  if (error) return <EmptyState title="Failed to load history" description={error} />;

  return (
    <div className="history-page">
      <div className="page-header-row">
        <div>
          <p className="page-kicker"><History size={14} /> Analysis archive</p>
          <h2 className="page-title">Prediction History</h2>
          <p className="page-subtitle">{history.length} prediction{history.length !== 1 ? "s" : ""} total</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="inline-link" onClick={handleExport} disabled={!filtered.length}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {stats && (
        <div className="history-stats-grid">
          <div className="stat-card stat-card--green">
            <div className="stat-icon">
              <TrendingUp size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Avg Property Price</span>
              <h4 className="stat-value">{fmt(stats.avgPrice, history[0]?.country)}</h4>
              <p className="stat-range">{fmt(stats.minPrice, history[0]?.country)} - {fmt(stats.maxPrice, history[0]?.country)}</p>
            </div>
          </div>

          <div className="stat-card stat-card--purple">
            <div className="stat-icon">
              <Activity size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Avg DNA Score</span>
              <h4 className="stat-value">{stats.avgDna}</h4>
              <p className="stat-range">{stats.minDna} - {stats.maxDna}</p>
            </div>
          </div>

          <div className="stat-card stat-card--blue">
            <div className="stat-icon">
              <Award size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">High Quality</span>
              <h4 className="stat-value">{stats.highQualityPct}%</h4>
              <p className="stat-range">{stats.highQualityCount} excellent properties</p>
            </div>
          </div>

          <div className="stat-card stat-card--orange">
            <div className="stat-icon">
              <MapPin size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Quality Distribution</span>
              <h4 className="stat-value">{stats.mediumQualityPct}%</h4>
              <p className="stat-range">Balanced investment prospects</p>
            </div>
          </div>
        </div>
      )}

      <div className="history-filters">
        <div className="filter-group">
          <SlidersHorizontal size={14} />
          <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} aria-label="Filter by country">
            <option value="all">All countries</option>
            {countries_list.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="dna-filter">Min DNA:</label>
          <input 
            id="dna-filter"
            type="range" 
            min="0" 
            max="100" 
            value={dnaFilterMin}
            onChange={(e) => setDnaFilterMin(Number(e.target.value))}
            title="Filter by DNA score"
          />
          <span>{dnaFilterMin}</span>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">
          <option value="date">Sort: Newest</option>
          <option value="dna">Sort: DNA Score</option>
          <option value="price">Sort: Price</option>
        </select>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No predictions yet"
          description="Your prediction history will appear here once you run analyses."
        />
      ) : (
        <>
          <div className="table-card history-table-desktop">
            <table className="prediction-table prediction-table--clickable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>DNA</th>
                  <th>Age</th>
                  <th>Signal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} onClick={() => setSelected(item)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(item)}>
                    <td><strong>{idx + 1}</strong></td>
                    <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</td>
                    <td className="location-cell">
                      <div className="location-info">
                        <strong>{item.city || "—"}</strong>
                        <span>{item.country || "—"}</span>
                      </div>
                    </td>
                    <td className="price-cell">{fmt(item.predicted_price, item.country)}</td>
                    <td className="dna-cell">
                      <div className="dna-badge" style={{
                        backgroundColor: (item.dna_score ?? 0) >= 75 ? '#dcfce7' : (item.dna_score ?? 0) >= 50 ? '#fef3c7' : '#fee2e2'
                      }}>
                        {item.dna_score != null ? Number(item.dna_score).toFixed(1) : "—"}
                      </div>
                    </td>
                    <td>{item.predicted_age ?? "—"} yrs</td>
                    <td>
                      {(item.dna_score ?? 0) >= 75 ? (
                        <span className="signal-badge signal-badge--buy">🟢 Strong</span>
                      ) : (item.dna_score ?? 0) >= 50 ? (
                        <span className="signal-badge signal-badge--hold">🟡 Moderate</span>
                      ) : (
                        <span className="signal-badge signal-badge--watch">🔴 Weak</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="history-cards-mobile">
            {filtered.map((item) => (
              <button key={item.id} type="button" className="history-card" onClick={() => setSelected(item)}>
                <div className="card-header">
                  <strong>{[item.city, item.country].filter(Boolean).join(", ")}</strong>
                  <span className="card-date">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</span>
                </div>
                <div className="card-body">
                  <div className="card-item">
                    <span className="card-label">Price</span>
                    <span className="card-value">{fmt(item.predicted_price, item.country)}</span>
                  </div>
                  <div className="card-item">
                    <span className="card-label">DNA</span>
                    <span className="card-value">{item.dna_score != null ? Number(item.dna_score).toFixed(1) : "—"}</span>
                  </div>
                  <div className="card-item">
                    <span className="card-label">Age</span>
                    <span className="card-value">{item.predicted_age ?? "—"} yrs</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <PropertyDetailDrawer
        item={selected}
        onClose={() => setSelected(null)}
        onFavorite={handleFavorite}
        onSaveReport={handleSaveReport}
      />
    </div>
  );
}
