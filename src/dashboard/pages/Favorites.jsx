import { useEffect, useMemo, useState } from "react";
import { Heart, Plus, Trash2, MapPin } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getFavoritesByEmail, addFavoriteByEmail, deleteFavoriteByEmail } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { useDashboard } from "../context/DashboardContext";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import DNAGauge from "../components/DNAGauge";
import { formatCurrency } from "../../utils/formatCurrency";

const EMPTY_FORM = { city: "", state: "", country: "", dna_score: "", predicted_price: "" };

export default function Favorites() {
  const { user } = useUser();
  const { searchQuery, addNotification } = useDashboard();
  const refreshTick = useBackendRefresh();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getFavoritesByEmail(user.email)
      .then(setFavorites)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user, refreshTick]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter(
      (item) =>
        (item.city || "").toLowerCase().includes(q) ||
        (item.country || "").toLowerCase().includes(q),
    );
  }, [favorites, searchQuery]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) return;
    setAdding(true);
    try {
      await addFavoriteByEmail(user.email, {
        city: form.city,
        state: form.state,
        country: form.country,
        dna_score: Number(form.dna_score) || 0,
        predicted_price: Number(form.predicted_price) || 0,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
      addNotification("Added to watchlist", "success");
    } catch (e) {
      addNotification("Failed to add: " + e.message, "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove from watchlist?")) return;
    try {
      await deleteFavoriteByEmail(user.email, id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      addNotification("Removed from watchlist", "info");
    } catch (e) {
      addNotification("Delete failed: " + e.message, "error");
    }
  };

  if (!user) return <EmptyState icon={Heart} title="Sign in to view your watchlist" actionLabel="Sign in" actionTo="/#login" />;
  if (loading) return <PageSkeleton />;
  if (error) return <EmptyState title="Failed to load watchlist" description={error} />;

  return (
    <div className="favorites-page">
      <div className="page-header-row">
        <div>
          <p className="page-kicker"><Heart size={14} /> Location watchlist</p>
          <h2 className="page-title">Watchlist</h2>
          <p className="page-subtitle">Locations you're monitoring for investment opportunities.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add Location"}
          {!showForm && <Plus size={16} />}
        </button>
      </div>

      {showForm && (
        <form className="card add-form" onSubmit={handleAdd}>
          <h3>Add to Watchlist</h3>
          <p className="form-hint">Or star locations from your prediction history.</p>
          <div className="form-grid">
            {[["city", "City"], ["state", "State"], ["country", "Country"], ["dna_score", "DNA Score"], ["predicted_price", "Price"]].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={["dna_score", "predicted_price"].includes(key) ? "number" : "text"}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={label}
                />
              </label>
            ))}
          </div>
          <button className="btn-primary" type="submit" disabled={adding}>{adding ? "Adding..." : "Add to Watchlist"}</button>
        </form>
      )}

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No locations on watchlist"
          description="Save locations you want to monitor from prediction history."
          steps={["Open Prediction History", "Click a row to view details", "Add to watchlist"]}
          actionLabel="View History"
          actionTo="/dashboard/prediction-history"
        />
      ) : (
        <div className="favorites-grid">
          {filtered.map((item) => (
            <div className="card favorite-card-enhanced" key={item.id}>
              <div className="favorite-card-header">
                <div className="favorite-card-title">
                  <DNAGauge score={item.dna_score} size={48} />
                  <div>
                    <h3>{item.city || "Unknown City"}</h3>
                    <p><MapPin size={13} /> {[item.state, item.country].filter(Boolean).join(", ") || "—"}</p>
                  </div>
                </div>
                <button className="btn-danger-sm" onClick={() => handleDelete(item.id)} aria-label="Delete favorite">
                  <Trash2 size={16} />
                </button>
              </div>
              {item.predicted_price > 0 && (
                <p className="favorite-price">{formatCurrency(item.predicted_price, item.country)}</p>
              )}
              <p className="date-small">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
