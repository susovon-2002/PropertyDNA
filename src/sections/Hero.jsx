import { ArrowRight, CircleHelp, Sparkles } from 'lucide-react';
import AgeSummary from '../components/AgeSummary.jsx';

export default function Hero({ age, year }) {
  return (
    <section id="home" className="hero">
      <div className="heroCopy reveal">
        <span className="heroBadge"><Sparkles size={16} /> AI-powered property insight</span>
        <h1>Predict House Price &amp;<br /><span>House Age</span> with PropertyDNA</h1>
        <p>Estimate property age and market value from year built, size, rooms, materials, country, and renovations with a clean, modern interface.</p>
        <div className="heroActions">
          <a className="primaryBtn" href="#predictor"><Sparkles size={17} /> Try Predictor Now</a>
          <a className="secondaryBtn" href="#works"><CircleHelp size={17} /> Learn More</a>
        </div>
        <div className="example">
          <CircleHelp size={21} />
          <strong>Example:</strong>
          <span>Built in 2010 and current year is 2026</span>
          <ArrowRight className="exampleArrow" size={19} />
          <span>Predicted Age: <em>16 years</em></span>
        </div>
      </div>
      <AgeSummary age={age} year={year} className="floatingResult reveal delay" />
    </section>
  );
}
