import { BrainCircuit, Clock3, Coins, House } from 'lucide-react';

const steps = [
  {
    icon: House,
    tone: 'green',
    title: '1. Input Features',
    text: 'Provide key property specifications such as construction year, square footage, layout rooms, materials, and localized country.'
  },
  {
    icon: BrainCircuit,
    tone: 'blue',
    title: '2. AI Pattern Analysis',
    text: 'Our regression models process the inputs against regional datasets, cost parameters, and material wear and tear indicators.'
  },
  {
    icon: Clock3,
    tone: 'purple',
    title: '3. Calculate Age',
    text: 'Estimates the effective age of the structure by evaluating the built calendar year, current year context, and renovations.'
  },
  {
    icon: Coins,
    tone: 'gold',
    title: '4. Financial Valuation',
    text: 'Computes a localized market value range using local currencies, materials multipliers, room count bonuses, and age depreciation.'
  }
];

export default function HowItWorks({ currencySymbol = '$' }) {
  return (
    <article id="works" className="panel how">
      <div className="sectionHead">
        <span>Process</span>
        <h2>How It Works</h2>
      </div>
      <div className="steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div className="stepGroup" key={step.title}>
              <div className="step">
                <div className={`bubble ${step.tone}`}>
                  {index === 3 ? (
                    <span 
                      className={`currencyIcon ${currencySymbol.length > 1 ? 'longSymbol' : ''}`}
                      aria-hidden="true"
                    >
                      {currencySymbol}
                    </span>
                  ) : (
                    <Icon size={32} />
                  )}
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
              {index < steps.length - 1 && <div className="connector" />}
            </div>
          );
        })}
      </div>
    </article>
  );
}
