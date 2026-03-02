interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-card border shadow-card ${className}`}
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-light)",
      }}
    >
      {title && (
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: "var(--border-light)" }}
        >
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
