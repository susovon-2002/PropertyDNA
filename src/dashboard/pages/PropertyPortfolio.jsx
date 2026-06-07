import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Trash2, Sparkles, Home, Ruler, BedDouble, Bath, CalendarDays, MapPin } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getPortfolioByEmail, addPortfolioByEmail, deletePortfolioByEmail } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { useDashboard } from "../context/DashboardContext";
import { countries } from "../../utils/constants.js";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import DNAGauge from "../components/DNAGauge";

const getCountryMeta = (country) =>
  countries.find((item) => item.name === country) || countries.find((item) => item.name === "United States") || countries[0];

const fmt = (v, country) => (v != null && Number(v) > 0 ? `${getCountryMeta(country).symbol}${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—");
const num = (v) => (v != null && Number(v) > 0 ? Number(v).toLocaleString() : "—");
const short = (value) => (value ? String(value) : "—");

const EMPTY_FORM = {
  property_name: "", city: "", state: "", country: "", predicted_price: "", dna_score: "",
  property_type: "", year_built: "", house_size_sqft: "", bedrooms: "", bathrooms: "", predicted_age: "",
};

const ACCENTS = ["portfolio-card--green", "portfolio-card--blue", "portfolio-card--purple", "portfolio-card--orange"];

export default function PropertyPortfolio() {
  const { user } = useUser();
  const { searchQuery, addNotification } = useDashboard();
  const refreshTick = useBackendRefresh();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  const load = () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getPortfolioByEmail(user.email)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user, refreshTick]);

  const filtered = useMemo(() => {
    let rows = [...items];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (item) =>
          (item.property_name || "").toLowerCase().includes(q) ||
          (item.city || "").toLowerCase().includes(q) ||
          (item.country || "").toLowerCase().includes(q),
      );
    }
    if (sortBy === "dna") rows.sort((a, b) => (b.dna_score ?? 0) - (a.dna_score ?? 0));
    else if (sortBy === "price") rows.sort((a, b) => (b.predicted_price ?? 0) - (a.predicted_price ?? 0));
    return rows;
  }, [items, searchQuery, sortBy]);

  const portfolioValue = items.reduce((s, p) => s + (Number(p.predicted_price) || 0), 0);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) return;
    setAdding(true);
    try {
      await addPortfolioByEmail(user.email, {
        property_name: form.property_name,
        city: form.city,
        state: form.state,
        country: form.country,
        predicted_price: Number(form.predicted_price) || 0,
        dna_score: Number(form.dna_score) || 0,
        notes: "",
        property_type: form.property_type,
        year_built: Number(form.year_built) || 0,
        house_size_sqft: Number(form.house_size_sqft) || 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        predicted_age: Number(form.predicted_age) || 0,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
      addNotification("Property added to portfolio", "success");
    } catch (e) {
      addNotification("Failed to add: " + e.message, "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this property from your portfolio?")) return;
    try {
      await deletePortfolioByEmail(user.email, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      addNotification("Property removed", "info");
    } catch (e) {
      addNotification("Delete failed: " + e.message, "error");
    }
  };

  if (!user) return <EmptyState icon={Building2} title="Sign in to manage your portfolio" actionLabel="Sign in" actionTo="/#login" />;
  if (loading) return <PageSkeleton />;
  if (error) return <EmptyState title="Failed to load portfolio" description={error} />;

  return (
    <div className="portfolio-page">
      <div className="page-header-row">
        <div>
          <p className="page-kicker"><Building2 size={14} /> Portfolio management</p>
          <h2 className="page-title">Property Portfolio</h2>
          <p className="page-subtitle">Properties you've saved from predictions.</p>
        </div>
        <div className="page-header-actions">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort portfolio">
            <option value="recent">Recently added</option>
            <option value="dna">DNA score</option>
            <option value="price">Price</option>
          </select>
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add manually"}
            {!showForm && <Plus size={16} />}
          </button>
        </div>
      </div>

      <div className="portfolio-summary-grid">
        <div className="portfolio-summary-card card-accent card-accent--green">
          <span>Total Properties</span>
          <strong className="stat-value-lg">{items.length}</strong>
          <p>Saved in portfolio</p>
        </div>
        <div className="portfolio-summary-card card-accent card-accent--blue">
          <span>Portfolio Value</span>
          <strong className="stat-value-lg">{fmt(portfolioValue, items[0]?.country)}</strong>
          <p>Combined estimated value</p>
        </div>
      </div>

      {showForm && (
        <form className="card add-form" onSubmit={handleAdd}>
          <h3>Add Property Manually</h3>
          <p className="form-hint">Tip: Save directly from a prediction for faster workflow.</p>
          <div className="form-grid form-grid--portfolio">
            {[["property_name", "Property Name"], ["property_type", "Property Type"], ["city", "City"], ["state", "State"], ["country", "Country"], ["year_built", "Year Built"], ["house_size_sqft", "House Size (sqft)"], ["bedrooms", "Bedrooms"], ["bathrooms", "Bathrooms"], ["predicted_price", "Price"], ["dna_score", "DNA Score"], ["predicted_age", "Predicted Age"]].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={["predicted_price", "dna_score", "year_built", "house_size_sqft", "bedrooms", "bathrooms", "predicted_age"].includes(key) ? "number" : "text"}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={label}
                />
              </label>
            ))}
          </div>
          <button className="btn-primary" type="submit" disabled={adding}>{adding ? "Adding..." : "Add to Portfolio"}</button>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties in portfolio"
          description="Save properties from your predictions to track them here."
          steps={["View your prediction history", "Enter a property name", "Click Save to Portfolio"]}
        />
      ) : (
        <div className="portfolio-grid">
          {filtered.map((item, index) => (
            <article key={item.id} className={`portfolio-card ${ACCENTS[index % ACCENTS.length]}`}>
              <div className="portfolio-card-head">
                <div className="portfolio-card-title">
                  <DNAGauge score={item.dna_score} size={52} />
                  <div>
                    <span className="portfolio-index">#{String(index + 1).padStart(2, "0")}</span>
                    <h3>{short(item.property_name || item.city)}</h3>
                    <p>{[item.state, item.country].filter(Boolean).join(", ") || "Saved property"}</p>
                  </div>
                </div>
                <button className="btn-danger-sm" onClick={() => handleDelete(item.id)} aria-label="Delete portfolio item">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="portfolio-price">
                <span>Estimated Value</span>
                <strong>{fmt(item.predicted_price, item.country)}</strong>
              </div>
              <div className="portfolio-metrics">
                <span><Sparkles size={14} /> DNA {item.dna_score != null ? Number(item.dna_score).toFixed(1) : "—"}</span>
                <span><Home size={14} /> {short(item.property_type || "Property")}</span>
                <span><CalendarDays size={14} /> Year {num(item.year_built)}</span>
                <span><Ruler size={14} /> {num(item.house_size_sqft)} sqft</span>
                <span><BedDouble size={14} /> {num(item.bedrooms)} beds</span>
                <span><Bath size={14} /> {num(item.bathrooms)} baths</span>
                <span><MapPin size={14} /> Age {num(item.predicted_age)} yrs</span>
              </div>
              <div className="portfolio-footer">
                <span>Added</span>
                <strong>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}</strong>
              </div>
            </article>
          ))}
        </div>
      )}

      {items.length > 0 && filtered.length === 0 && (
        <EmptyState title="No matching properties" description="Try a different search term." />
      )}
    </div>
  );
}
