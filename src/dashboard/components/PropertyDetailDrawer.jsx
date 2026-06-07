import { X, MapPin, Sparkles, CalendarDays, BedDouble, Ruler, Heart, Building2, FileText } from "lucide-react";
import { countries } from "../../utils/constants.js";
import DNAGauge from "./DNAGauge.jsx";

const getCountryMeta = (country) =>
  countries.find((c) => c.name === country) || countries[0];

const fmtMoney = (value, country) => {
  const meta = getCountryMeta(country);
  return `${meta.symbol}${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export default function PropertyDetailDrawer({ item, onClose, onFavorite, onPortfolio, onSaveReport }) {
  if (!item) return null;

  const location = [item.city, item.state, item.country].filter(Boolean).join(", ");

  return (
    <div className="drawer-overlay" onClick={onClose} role="presentation">
      <aside className="property-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Property details">
        <div className="property-drawer-header">
          <div>
            <p className="section-kicker">Property details</p>
            <h3>{location || "Unknown location"}</h3>
          </div>
          <button type="button" className="topbar-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="property-drawer-body">
          <div className="property-drawer-hero">
            <DNAGauge score={item.dna_score} size={100} label="DNA Score" />
            <div>
              <span className="property-drawer-label">Estimated price</span>
              <strong className="property-drawer-price">{fmtMoney(item.predicted_price, item.country)}</strong>
              <div className="property-drawer-chips">
                {item.predicted_age != null && (
                  <span><CalendarDays size={14} /> {item.predicted_age} yrs</span>
                )}
                {item.rooms != null && (
                  <span><BedDouble size={14} /> {item.rooms} beds</span>
                )}
                {item.size_sqft != null && (
                  <span><Ruler size={14} /> {Number(item.size_sqft).toLocaleString()} sqft</span>
                )}
                {item.material && (
                  <span><Building2 size={14} /> {item.material}</span>
                )}
              </div>
            </div>
          </div>

          <div className="property-drawer-meta">
            <div><MapPin size={16} /><span>{item.country || "—"}</span></div>
            <div><Sparkles size={16} /><span>DNA {item.dna_score != null ? Number(item.dna_score).toFixed(1) : "—"}</span></div>
            <div><CalendarDays size={16} /><span>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</span></div>
          </div>

          <div className="property-drawer-actions">
            {onFavorite && (
              <button type="button" className="inline-link" onClick={() => onFavorite(item)}>
                <Heart size={16} /> Add to Watchlist
              </button>
            )}
            {onSaveReport && (
              <button type="button" className="inline-link" onClick={() => onSaveReport(item)}>
                <FileText size={16} /> Save as Report
              </button>
            )}
            {onPortfolio && (
              <button type="button" className="btn-primary" onClick={() => onPortfolio(item)}>
                Save to Portfolio
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
