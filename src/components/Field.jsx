export default function Field({ label, icon: Icon, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="control">
        <Icon size={16} />
        {children}
      </div>
    </label>
  );
}
