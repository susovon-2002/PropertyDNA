import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  FileText,
  Leaf,
  MapPin,
  ScanLine,
  Shield,
  TrendingUp,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useUser } from "../../utils/UserContext";
import { getPredictionsByEmail, saveReportByEmail } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { countries } from "../../utils/constants";
import { useDashboard } from "../context/DashboardContext";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const countryMeta = (country) =>
  countries.find((item) => item.name === country) || countries[0];

const fmtMoney = (value, country) => {
  const meta = countryMeta(country);
  return `${meta.symbol}${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const getGrade = (score) => {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Excellent";
  if (score >= 60) return "Strong";
  if (score >= 45) return "Balanced";
  return "Developing";
};

const getPrimaryCountry = (predictions) => {
  const counts = new Map();
  predictions.forEach((item) => {
    if (!item.country) return;
    counts.set(item.country, (counts.get(item.country) || 0) + 1);
  });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top?.[0] || predictions?.[0]?.country || "United States";
};

const getCategoryIcon = (label) => {
  if (label === "Location Quality") return MapPin;
  if (label === "Infrastructure") return Building2;
  if (label === "Investment Potential") return TrendingUp;
  if (label === "Environmental Quality") return Leaf;
  if (label === "Market Trend") return Activity;
  return Shield;
};

export default function PropertyDNAReports() {
  const { user } = useUser();
  const { addNotification } = useDashboard();
  const refreshTick = useBackendRefresh();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getPredictionsByEmail(user.email)
      .then((preds) => {
        if (!preds.length) {
          setReport(null);
          return;
        }

        const total = preds.length;
        const avgDnaRaw = preds.reduce((sum, item) => sum + (Number(item.dna_score) || 0), 0) / total;
        const avgPrice = preds.reduce((sum, item) => sum + (Number(item.predicted_price) || 0), 0) / total;
        const avgAge = preds.reduce((sum, item) => sum + (Number(item.predicted_age) || 0), 0) / total;
        const primaryCountry = getPrimaryCountry(preds);
        const overallScore = clamp(Math.round(avgDnaRaw * 4), 0, 100);
        const base = clamp(overallScore / 10, 5.1, 9.3);

        const categories = [
          { label: "Location Quality", value: clamp(base + 0.6, 0, 10), color: "#16a34a", accent: "#dcfce7" },
          { label: "Infrastructure", value: clamp(base + 0.1, 0, 10), color: "#2563eb", accent: "#dbeafe" },
          { label: "Investment Potential", value: clamp(base + 0.3, 0, 10), color: "#f59e0b", accent: "#fef3c7" },
          { label: "Environmental Quality", value: clamp(base + 0.2, 0, 10), color: "#14b8a6", accent: "#ccfbf1" },
          { label: "Market Trend", value: clamp(base + 0.4, 0, 10), color: "#7c3aed", accent: "#ede9fe" },
          { label: "Safety Score", value: clamp(base + 0.25, 0, 10), color: "#f43f5e", accent: "#ffe4e6" },
        ];

        setReport({
          totalPreds: total,
          avgDnaRaw,
          overallScore,
          avgPrice,
          avgAge: Math.round(avgAge),
          primaryCountry,
          grade: getGrade(overallScore),
          summary:
            overallScore >= 75
              ? "Strong fundamentals with a healthy market profile."
              : overallScore >= 60
                ? "Balanced performance across the current prediction set."
                : "Early signals are forming across your saved predictions.",
          categories,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, refreshTick]);

  const handleSaveDNAReport = async () => {
    if (!report || !user) return;
    setSaving(true);
    try {
      await saveReportByEmail(user.email, {
        report_name: `DNA Analysis Report – ${report.primaryCountry} (${new Date().toLocaleDateString()})`,
        country: report.primaryCountry,
        state: "",
        city: "",
        predicted_price: Math.round(report.avgPrice),
        dna_score: Number(report.avgDnaRaw.toFixed(2)),
        predicted_age: report.avgAge,
      });
      addNotification("DNA Report saved to My Saved Reports 📄", "success");
    } catch (e) {
      addNotification("Failed to save report: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const radarData = useMemo(
    () =>
      report?.categories.map((item) => ({
        subject: item.label,
        score: Number(item.value.toFixed(1)),
      })) || [],
    [report],
  );

  if (!user) {
    return <div className="page-empty"><h2>Sign in to view DNA reports.</h2></div>;
  }

  if (loading) {
    return <div className="page-empty"><p>Loading...</p></div>;
  }

  if (!report) {
    return (
      <div className="dna-reports-page">
        <div className="page-header">
          <div>
            <p className="page-kicker">
              <ScanLine size={14} />
              Model report
            </p>
            <h2 className="page-title">DNA Analysis</h2>
            <p className="page-subtitle">Auto-generated intelligence from your predictions.</p>
          </div>
        </div>
        <div className="empty-state-card dna-empty-report">
          <h3>No DNA data yet</h3>
          <p>Run a few predictions and the report summary will populate automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dna-reports-page">
      <div className="page-header">
        <div>
          <p className="page-kicker">
            <ScanLine size={14} />
            Model report
          </p>
          <h2 className="page-title">DNA Analysis</h2>
          <p className="page-subtitle">
            Aggregated intelligence from {report.totalPreds} prediction{report.totalPreds !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSaveDNAReport}
          disabled={saving}
        >
          <FileText size={15} />
          {saving ? "Saving..." : "Save Report"}
        </button>
      </div>

      <section className="dna-overview-card panel">
        <div className="dna-overview-copy">
          <div className="dna-score-ring" style={{ "--ring": `${report.overallScore}%` }}>
            <div className="dna-score-ring__inner">
              <strong>{report.overallScore}</strong>
              <span>/100</span>
            </div>
          </div>

          <div className="dna-overview-text">
            <p className="section-kicker">
              <ScanLine size={14} />
              Overall DNA Score
            </p>
            <h3>{report.grade}</h3>
            <p>{report.summary}</p>

            <button type="button" className="inline-link dna-breakdown-btn">
              Score breakdown
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="dna-overview-side">
          <div className="dna-summary-stat">
            <span>Avg Price</span>
            <strong>{fmtMoney(report.avgPrice, report.primaryCountry)}</strong>
          </div>
          <div className="dna-summary-stat">
            <span>Avg Age</span>
            <strong>{report.avgAge} years</strong>
          </div>
          <div className="dna-summary-stat">
            <span>Primary Market</span>
            <strong>{report.primaryCountry}</strong>
          </div>
        </div>
      </section>

      <section className="dna-radar-card panel">
        <div className="section-header">
          <div>
            <p className="section-kicker">
              <Activity size={14} />
              Score breakdown
            </p>
            <h3>Category overview</h3>
          </div>
        </div>

        <div className="dna-radar-layout">
          <div className="dna-radar-copy">
            <div className="dna-radar-legend">
              {report.categories.map((item) => {
                const Icon = getCategoryIcon(item.label);
                return (
                  <div className="dna-radar-legend-item" key={item.label}>
                    <span className="dna-radar-legend-icon" style={{ color: item.color, background: item.accent }}>
                      <Icon size={16} />
                    </span>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.value.toFixed(1)} / 10</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dna-radar-chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148, 163, 184, 0.28)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 12 }} />
                <Radar
                  dataKey="score"
                  stroke="#1fb46b"
                  fill="rgba(31, 180, 107, 0.22)"
                  fillOpacity={0.65}
                  strokeWidth={2}
                />
                <Tooltip
                  cursor={{ stroke: "rgba(31,180,107,.18)" }}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="dna-mini-grid">
        {report.categories.map((item) => {
          const Icon = getCategoryIcon(item.label);
          const score = Number(item.value.toFixed(1));
          const toneClass =
            item.label === "Location Quality"
              ? "green"
              : item.label === "Infrastructure"
                ? "blue"
                : item.label === "Investment Potential"
                  ? "orange"
                  : item.label === "Environmental Quality"
                    ? "teal"
                    : item.label === "Market Trend"
                      ? "purple"
                      : "rose";

          return (
            <article
              key={item.label}
              className="dna-mini-card"
              data-tone={toneClass}
              style={{
                "--mini-accent": item.color,
                "--mini-shadow": item.accent,
              }}
            >
              <div className="dna-mini-head">
                <span className="dna-mini-icon" style={{ color: item.color, background: item.accent }}>
                  <Icon size={16} />
                </span>
                <div className="dna-mini-copy">
                  <strong>{item.label}</strong>
                  <span>{score.toFixed(1)} / 10</span>
                </div>
              </div>

              <div className="dna-mini-status">
                <span>{getGrade(score * 10)}</span>
                <strong style={{ color: item.color }}>{score.toFixed(1)}</strong>
              </div>

              <div className="dna-mini-track">
                <span style={{ width: `${Math.round(score * 10)}%`, background: item.color }} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
