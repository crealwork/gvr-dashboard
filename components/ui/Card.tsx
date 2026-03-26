export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface rounded-card shadow-card p-6 ${className}`}>
      {children}
    </div>
  );
}
