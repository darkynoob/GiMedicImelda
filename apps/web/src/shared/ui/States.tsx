export function LoadingState({ label }: { label: string }) {
  return (
    <div className="feedback-card">
      <span className="feedback-dot" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="feedback-card empty">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
