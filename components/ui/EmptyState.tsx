interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div
          className="mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          {icon}
        </div>
      )}
      <h3
        className="text-lg font-semibold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm max-w-sm mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
