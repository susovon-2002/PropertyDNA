export default function DNAGauge({ score, size = 88, label }) {
  const value = Math.min(100, Math.max(0, Number(score) || 0));
  const tone = value >= 75 ? "high" : value >= 50 ? "mid" : "low";

  return (
    <div className={`dna-gauge dna-gauge--${tone}`} style={{ "--gauge": `${value}%`, "--size": `${size}px` }}>
      <div className="dna-gauge-ring">
        <strong>{value ? value.toFixed(1) : "—"}</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}
