import React from 'react';
import { Cpu, Home } from 'lucide-react';

export default function HouseAISection({ user, onSignInClick }) {
  const handleOpen = (event) => {
    if (!user) {
      event.preventDefault();
      onSignInClick();
      return;
    }
    window.location.hash = '#predict';
  };

  return (
    <button type="button" className="houseai-screenshot-card" aria-label="Open HouseAI scan and predictions page" onClick={handleOpen}>
      {/* Left Visual Element */}
      <div className="card-visual-container">
        {/* Orbiting Indian Flag Rings */}
        <div className="ring ring-orange">
          <span className="ring-dot dot-orange"></span>
        </div>
        <div className="ring ring-white">
          <span className="ring-dot dot-white"></span>
        </div>
        <div className="ring ring-green">
          <span className="ring-dot dot-green"></span>
        </div>

        {/* Central main circle with house icon */}
        <div className="main-circle-badge">
          <Home size={40} className="main-house-icon" strokeWidth={1.5} />
        </div>

        {/* Overlapping top-left AI badge */}
        <div className="ai-badge-top-left">
          <span>AI</span>
        </div>

        {/* Overlapping bottom-right Chip badge */}
        <div className="chip-badge-bottom-right">
          <Cpu size={17} className="chip-icon" />
        </div>
      </div>

      {/* Right Text Content */}
      <div className="card-text-container">
        <h2 className="card-heading">Predict House Price &amp; Age Today!</h2>
        <p className="card-subheading">Know Your Valuation &amp; Lifetime. with PropertyDNA</p>
        <span className="card-cta-link">A PropertyDNA AI</span>
      </div>
    </button>
  );
}
