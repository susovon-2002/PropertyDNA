import { CalendarDays } from 'lucide-react';
import { CURRENT_YEAR } from '../utils/constants.js';

export default function AgeSummary({ age, year, className = '' }) {
  return (
    <aside className={`ageSummary ${className}`}>
      <span className="summaryEyebrow">Predicted Age</span>
      <strong key={age}>{age}</strong>
      <b>years</b>
      <div className="summaryMeta">
        <p><CalendarDays size={16} /> Built in: {year || 2010}</p>
        <p><CalendarDays size={16} /> Current Year: {CURRENT_YEAR}</p>
      </div>
    </aside>
  );
}
