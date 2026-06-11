import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getReportsByEmail, saveReportByEmail, deleteReportByEmail } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { useDashboard } from "../context/DashboardContext";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { formatCurrency } from "../../utils/formatCurrency";

const EMPTY_FORM = {
  report_name: "", country: "", state: "", city: "",
  predicted_price: "", dna_score: "", predicted_age: "",
};

export default function SavedReports() {
  const { user } = useUser();
  const { searchQuery, addNotification } = useDashboard();
  const refreshTick = useBackendRefresh();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getReportsByEmail(user.email)
      .then((data) => {
        console.log("SavedReports - received:", data);
        setReports(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user, refreshTick]);
  console.log("SavedReports - state:", reports);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        (r.report_name || "").toLowerCase().includes(q) ||
        (r.city || "").toLowerCase().includes(q) ||
        (r.country || "").toLowerCase().includes(q),
    );
  }, [reports, searchQuery]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !form.report_name.trim()) {
      addNotification("Report name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      await saveReportByEmail(user.email, {
        report_name: form.report_name,
        country: form.country,
        state: form.state,
        city: form.city,
        predicted_price: Number(form.predicted_price) || 0,
        dna_score: Number(form.dna_score) || 0,
        predicted_age: Number(form.predicted_age) || 0,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
      addNotification("Report saved", "success");
    } catch (e) {
      addNotification("Failed to save: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this report?")) return;
    try {
      await deleteReportByEmail(user.email, id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      addNotification("Report deleted", "info");
    } catch (e) {
      addNotification("Delete failed: " + e.message, "error");
    }
  };

  if (!user) return <EmptyState icon={FileText} title="Sign in to view saved reports" actionLabel="Sign in" actionTo="/#login" />;
  if (loading) return <PageSkeleton />;
  if (error) return <EmptyState title="Failed to load reports" description={error} />;

  return (
    <div className="reports-page">
      <div className="page-header-row">
        <div>
          <p className="page-kicker"><FileText size={14} /> Stored analysis</p>
          <h2 className="page-title">My Saved Reports</h2>
          <p className="page-subtitle">Reports you've manually saved for reference.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Save Report"}
          {!showForm && <Plus size={16} />}
        </button>
      </div>

      {showForm && (
        <form className="card add-form" onSubmit={handleSave}>
          <h3>New Report</h3>
          <div className="form-grid">
            {[["report_name", "Report Name"], ["country", "Country"], ["state", "State"], ["city", "City"], ["predicted_price", "Price"], ["dna_score", "DNA Score"], ["predicted_age", "Age (years)"]].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={["predicted_price", "dna_score", "predicted_age"].includes(key) ? "number" : "text"}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={label}
                />
              </label>
            ))}
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Report"}</button>
        </form>
      )}

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No saved reports"
          description="Save custom reports or use DNA Analysis for auto-generated insights."
          actionLabel="View DNA Analysis"
          actionTo="/dashboard/property-dna-reports"
        />
      ) : (
        <div className="reports-grid">
          {filtered.map((r) => (
            <article className="card report-card" key={r.id}>
              <div className="report-card-head">
                <h3>{r.report_name}</h3>
                <button className="btn-danger-sm" onClick={() => handleDelete(r.id)} aria-label="Delete report">
                  <Trash2 size={16} />
                </button>
              </div>
              <p>{[r.city, r.state, r.country].filter(Boolean).join(", ") || "—"}</p>
              <div className="report-card-stats">
                <span>{formatCurrency(r.predicted_price, r.country)}</span>
                <span>DNA {r.dna_score != null ? Number(r.dna_score).toFixed(1) : "—"}</span>
                <span>Age {r.predicted_age ?? "—"} yrs</span>
              </div>
              <p className="date-small">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
