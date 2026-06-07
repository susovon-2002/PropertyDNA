import { Link } from "react-router-dom";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  steps,
  actionLabel,
  actionTo,
  onAction,
  children,
}) {
  return (
    <div className="empty-state-card empty-state-enhanced">
      {Icon && (
        <span className="empty-state-icon">
          <Icon size={28} />
        </span>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {steps?.length > 0 && (
        <ol className="empty-state-steps">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary empty-state-cta">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button type="button" className="btn-primary empty-state-cta" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {children}
    </div>
  );
}
