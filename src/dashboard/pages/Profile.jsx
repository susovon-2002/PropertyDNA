import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  CalendarDays,
  BadgeDollarSign,
  ChartNoAxesCombined,
  Globe2,
  FileText,
  Heart,
  Building2,
  Settings2,
  ShieldCheck,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { useUser } from "../../utils/UserContext";
import { getUser, getUserStats, getPredictions } from "../../utils/api";
import { useBackendRefresh } from "../../utils/useBackendRefresh";
import { PageSkeleton } from "../components/Skeleton";
import { formatCurrency } from "../../utils/formatCurrency";

export default function Profile() {
  const { user: ctxUser } = useUser();
  const refreshTick = useBackendRefresh();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [topCountry, setTopCountry] = useState("India");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ctxUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      getUser(ctxUser.id),
      getUserStats(ctxUser.id),
      getPredictions(ctxUser.id)
    ])
      .then(([p, s, preds]) => {
        setProfile(p);
        setStats(s);
        // Determine the most frequent country analyzed
        const counts = {};
        preds.forEach((pr) => {
          if (pr.country) counts[pr.country] = (counts[pr.country] || 0) + 1;
        });
        const top = Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
        setTopCountry(top ? top[0] : "India");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ctxUser, refreshTick]);

  if (!ctxUser) return <div className="page-empty"><h2>Please sign in to view your profile.</h2></div>;
  if (loading) return <PageSkeleton />;
  if (error) return <div className="page-empty"><h2>Failed to load profile: {error}</h2></div>;

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "PD";

  const cards = [
    {
      label: "Total Predictions",
      value: stats?.total_predictions ?? 0,
      icon: UserRound,
      accent: "purple",
      helper: "Property valuations run",
      link: "/dashboard/prediction-history"
    },
    {
      label: "Average Property Price",
      value: formatCurrency(stats?.avg_price ?? 0, topCountry),
      icon: BadgeDollarSign,
      accent: "blue",
      helper: `Based on analyses in ${topCountry}`,
      link: "/dashboard/prediction-history"
    },
    {
      label: "Average DNA Score",
      value: stats?.avg_dna_score != null ? Number(stats.avg_dna_score).toFixed(1) : "—",
      icon: ChartNoAxesCombined,
      accent: "green",
      helper: "Overall property quality score",
      link: "/dashboard/property-dna-reports"
    },
    {
      label: "Countries Analyzed",
      value: stats?.countries_analyzed ?? 0,
      icon: Globe2,
      accent: "orange",
      helper: "Global markets explored",
      link: "/dashboard/insights"
    },
    {
      label: "Saved Reports",
      value: stats?.saved_reports ?? 0,
      icon: FileText,
      accent: "blue",
      helper: "Exported property dossiers",
      link: "/dashboard/saved-reports"
    },
    {
      label: "Watchlist Locations",
      value: stats?.favorites ?? 0,
      icon: Heart,
      accent: "purple",
      helper: "Bookmarked cities & markets",
      link: "/dashboard/watchlist"
    },
    {
      label: "Portfolio Tracked",
      value: stats?.portfolio_count ?? 0,
      icon: Building2,
      accent: "green",
      helper: "Assets monitored in portfolio",
      link: "/dashboard/property-portfolio"
    },
  ];

  return (
    <div className="profile-page">
      <div className="page-header-row">
        <div>
          <p className="page-kicker"><UserRound size={14} /> Account profile</p>
          <h2 className="page-title">My Profile</h2>
          <p className="page-subtitle">Your activity and account overview.</p>
        </div>
        <Link to="/dashboard/settings" className="inline-link"><Settings2 size={14} /> Settings</Link>
      </div>

      <div className="profile-container">
        {/* Left column: Sidebar Card */}
        <div className="profile-sidebar-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-large">{initials}</div>
            <div className="profile-avatar-badge" title="Active Member">
              <ShieldCheck size={16} />
            </div>
          </div>
          
          <h3 className="profile-name-title">{profile?.name}</h3>
          <p className="profile-email-text">{profile?.email}</p>
          
          <span className="profile-pill">Premium Analyst</span>
          
          <div className="profile-info-divider"></div>
          
          <div className="profile-meta-list">
            <div className="profile-meta-item">
              <CalendarDays size={16} />
              <span>Joined</span>
              <strong>{joinedDate}</strong>
            </div>
            <div className="profile-meta-item">
              <Globe2 size={16} />
              <span>Primary Market</span>
              <strong>{topCountry}</strong>
            </div>
            <div className="profile-meta-item">
              <TrendingUp size={16} />
              <span>Total Activity</span>
              <strong>{stats?.total_predictions ?? 0} runs</strong>
            </div>
          </div>
          
          <div className="profile-actions-area">
            <Link to="/dashboard/settings" className="profile-action-btn profile-action-btn--primary">
              <Settings2 size={15} /> Account Settings
            </Link>
          </div>
        </div>

        {/* Right column: Metric Cards Dashboard */}
        <div className="profile-stats-dashboard">
          {cards.map(({ label, value, icon: Icon, accent, helper, link }) => (
            <div className={`profile-metric-card card-accent card-accent--${accent}`} key={label}>
              <div className="profile-metric-card-header">
                <span className="profile-metric-label">{label}</span>
                <div className={`profile-metric-icon-box profile-metric-icon-box--${accent}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <h2 className="profile-metric-value">{value}</h2>
                <p className="profile-metric-helper">{helper}</p>
              </div>
            </div>
          ))}

          {/* Quick Links Section */}
          <div className="profile-activity-section">
            <div className="profile-activity-header">
              <h3>Quick Resource Access</h3>
            </div>
            <div className="profile-activity-grid">
              <Link to="/dashboard/property-portfolio" className="profile-activity-card">
                <div className="profile-activity-icon-box">
                  <Building2 size={18} />
                </div>
                <div className="profile-activity-info">
                  <strong>My Property Portfolio</strong>
                  <span>Track and manage your real estate assets</span>
                </div>
                <ArrowRight size={14} style={{ marginLeft: "auto" }} />
              </Link>

              <Link to="/dashboard/saved-reports" className="profile-activity-card">
                <div className="profile-activity-icon-box">
                  <FileText size={18} />
                </div>
                <div className="profile-activity-info">
                  <strong>Saved DNA Reports</strong>
                  <span>View exported files and comprehensive analysis</span>
                </div>
                <ArrowRight size={14} style={{ marginLeft: "auto" }} />
              </Link>

              <Link to="/dashboard/new-prediction" className="profile-activity-card">
                <div className="profile-activity-icon-box">
                  <BadgeDollarSign size={18} />
                </div>
                <div className="profile-activity-info">
                  <strong>Run New Valuation</strong>
                  <span>Analyze age, price, and quality index of a property</span>
                </div>
                <ArrowRight size={14} style={{ marginLeft: "auto" }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
