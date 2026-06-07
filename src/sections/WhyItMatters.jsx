import { Banknote, ChartNoAxesCombined, Hammer, TrendingUp } from 'lucide-react';

const items = [
  {
    icon: Banknote,
    title: 'Property Valuation',
    text: 'Better estimate property market value with age-aware context.'
  },
  {
    icon: Hammer,
    title: 'Maintenance Planning',
    text: 'Plan repairs and upgrades based on the expected house lifecycle.'
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Real Estate Analysis',
    text: 'Make more confident data-driven real estate decisions.'
  },
  {
    icon: TrendingUp,
    title: 'Investment Decisions',
    text: 'Identify stronger opportunities before committing capital.'
  }
];

export default function WhyItMatters() {
  return (
    <article id="about" className="panel matters">
      <div className="sectionHead">
        <span>Benefits</span>
        <h2>Why It Matters</h2>
      </div>
      <div className="matterGrid">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div className="matterItem" key={item.title}>
              <span><Icon size={24} /></span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}
