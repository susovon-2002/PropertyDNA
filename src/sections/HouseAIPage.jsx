import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, RefreshCw, Sun, ShieldCheck, Activity, Thermometer, Cpu, Compass } from 'lucide-react';

export default function HouseAIPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState([
    'SYSTEM: Initialize HouseAI Vision System...',
    'SYSTEM: Connection established with XGBoost Core.',
    'SYSTEM: Ready for structural DNA signature analysis.'
  ]);
  const [metrics, setMetrics] = useState({
    structural: 94.2,
    thermal: 88.5,
    greenEnergy: 91.0,
    overall: 92.4
  });

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    addLog('USER: Initiated Deep Property DNA Scan.');
    addLog('SCANNER: Calibrating saffron, white, and green laser emitters...');
  };

  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          // Generate slightly randomized premium metrics upon scan completion
          const struct = parseFloat((85 + Math.random() * 14).toFixed(1));
          const therm = parseFloat((80 + Math.random() * 18).toFixed(1));
          const eco = parseFloat((82 + Math.random() * 16).toFixed(1));
          const over = parseFloat(((struct + therm + eco) / 3).toFixed(1));

          setMetrics({
            structural: struct,
            thermal: therm,
            greenEnergy: eco,
            overall: over
          });

          addLog(`SCANNER: Scan complete! 37 structural features mapped successfully.`);
          addLog(`ANALYSIS: Overall PropertyDNA Signature: ${over}% match.`);
          addLog(`SYSTEM: Database updated.`);
          return 100;
        }

        // Add contextual logs as progress increases
        if (next === 20) addLog('SCANNER: Saffron Zone (Foundation & Core structure) mapped.');
        if (next === 50) addLog('SCANNER: White Zone (Thermal envelope & HVAC efficiency) scanned.');
        if (next === 80) addLog('SCANNER: Green Zone (Solar availability & eco-sustainability) analyzed.');

        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isScanning]);

  return (
    <article className="houseai-page-container">
      {/* HEADER SECTION */}
      <header className="houseai-page-header">
        <a href="#home" className="back-btn">
          <ArrowLeft size={16} /> Back to Dashboard
        </a>
        <div className="header-title-area">
          <h1>HouseAI™ Vision Scanner</h1>
          <span className="live-badge">
            <span className="pulse-dot"></span> LIVE LAB SIMULATOR
          </span>
        </div>
      </header>

      {/* DASHBOARD LAYOUT */}
      <div className="houseai-dashboard-grid">
        {/* LEFT COLUMN: SCANNING VISUALIZER */}
        <section className="panel visualizer-card">
          <div className="card-header-simple">
            <Compass size={18} className="icon-green" />
            <h3>Holographic 3D Laser Alignment</h3>
          </div>

          <div className="visualizer-content">
            <div className="orbit-container large-visualizer">
              {/* Indian Flag Orbiting Rings */}
              <div className="ring ring-orange ring-large">
                <span className="ring-dot dot-orange"></span>
              </div>
              <div className="ring ring-white ring-large">
                <span className="ring-dot dot-white"></span>
              </div>
              <div className="ring ring-green ring-large">
                <span className="ring-dot dot-green"></span>
              </div>

              {/* Central House Image */}
              <div className="houseai-image-wrapper large-image">
                <img src="/houseai.png" alt="Futuristic House AI Vision" className="houseai-image" />
                
                {/* Active scan line overlay */}
                <div className={`houseai-scanner-line ${isScanning ? 'scanning-active' : ''}`}></div>
                
                {/* ashoka chakra inspired overlay */}
                <div className="chakra-overlay large-chakra">
                  <svg viewBox="0 0 100 100" className="spinning-chakra">
                    <circle cx="50" cy="50" r="45" stroke="#000080" strokeWidth="2" fill="none" opacity="0.8" />
                    <circle cx="50" cy="50" r="7" fill="#000080" />
                    {[...Array(24)].map((_, i) => (
                      <line
                        key={i}
                        x1="50"
                        y1="50"
                        x2={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)}
                        y2={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)}
                        stroke="#000080"
                        strokeWidth="1.2"
                        opacity="0.8"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>

            {/* SCAN PROGRESS BAR */}
            <div className="scan-progress-container">
              <div className="progress-labels">
                <span>Scan Status: {isScanning ? 'SCANNING...' : 'IDLE'}</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${scanProgress}%` }}></div>
              </div>
            </div>

            {/* CONTROL BUTTONS */}
            <div className="visualizer-actions">
              <button
                className={`action-btn trigger-btn ${isScanning ? 'disabled' : ''}`}
                onClick={startScan}
                disabled={isScanning}
              >
                <Play size={16} /> Trigger DNA Scan
              </button>
              <button
                className={`action-btn recalibrate-btn ${isScanning ? 'disabled' : ''}`}
                onClick={() => {
                  if (isScanning) return;
                  addLog('USER: Calibrated optical sensors. Alignment check OK.');
                }}
                disabled={isScanning}
              >
                <RefreshCw size={16} /> Recalibrate Sensor
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: ANALYTICS & LOGS */}
        <section className="houseai-details-panel">
          {/* ZONE METRICS */}
          <div className="panel metrics-grid-card">
            <div className="card-header-simple">
              <Activity size={18} className="icon-green" />
              <h3>Detected Zone Signatures</h3>
            </div>

            <div className="zone-metrics-container">
              {/* SAFFRON ZONE */}
              <div className="zone-card saffron-border">
                <div className="zone-info">
                  <span className="zone-tag tag-saffron">Saffron Zone</span>
                  <h4>Foundation & Core</h4>
                  <p>Load bearing safety & structural integrity</p>
                </div>
                <div className="zone-value">
                  <strong>{metrics.structural}%</strong>
                  <span>Excellent</span>
                </div>
              </div>

              {/* WHITE ZONE */}
              <div className="zone-card white-border">
                <div className="zone-info">
                  <span className="zone-tag tag-white">White Zone</span>
                  <h4>Thermal & Envelope</h4>
                  <p>Insulation efficiency, HVAC, & ventilation</p>
                </div>
                <div className="zone-value">
                  <strong>{metrics.thermal}%</strong>
                  <span>Optimal</span>
                </div>
              </div>

              {/* GREEN ZONE */}
              <div className="zone-card green-border">
                <div className="zone-info">
                  <span className="zone-tag tag-green">Green Zone</span>
                  <h4>Eco & Sustainability</h4>
                  <p>Solar readiness, green score, energy loss</p>
                </div>
                <div className="zone-value">
                  <strong>{metrics.greenEnergy}%</strong>
                  <span>Eco-ready</span>
                </div>
              </div>

              {/* OVERALL MATCH */}
              <div className="overall-score-panel">
                <div className="score-desc">
                  <h3>Overall PropertyDNA Integrity</h3>
                  <p>Composite index computed from XGBoost 37-feature regression weights.</p>
                </div>
                <div className="score-circle">
                  <strong>{metrics.overall}</strong>
                  <span>/ 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* TELEMETRY CONSOLE */}
          <div className="panel console-card">
            <div className="card-header-simple">
              <Cpu size={18} className="icon-green" />
              <h3>Sensor Telemetry Logs</h3>
            </div>
            <div className="console-output">
              {consoleLogs.map((log, index) => (
                <div key={index} className="console-line">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
