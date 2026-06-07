export function SkeletonLine({ short, className = "" }) {
  return <div className={`skeleton-line${short ? " short" : ""} ${className}`.trim()} />;
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="card skeleton-card">
      <SkeletonLine short />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="dashboard-stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card metric-card kpi-skeleton">
          <SkeletonLine short />
          <SkeletonLine />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page-skeleton">
      <div className="skeleton-line short" style={{ width: 120, marginBottom: 12 }} />
      <div className="skeleton-line" style={{ width: "40%", marginBottom: 24 }} />
      <SkeletonGrid count={4} />
    </div>
  );
}
