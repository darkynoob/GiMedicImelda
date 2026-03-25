export function SurfaceCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`surface-card ${className ?? ''}`.trim()}>{children}</section>;
}
