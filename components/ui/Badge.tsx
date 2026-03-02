type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  default: {
    bg: "var(--surface-muted)",
    color: "var(--text-secondary)",
    border: "var(--border)",
  },
  primary: {
    bg: "var(--interactive-light)",
    color: "var(--interactive)",
    border: "var(--interactive-border)",
  },
  success: {
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    border: "var(--success-border)",
  },
  warning: {
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    border: "var(--warning-border)",
  },
  danger: {
    bg: "var(--error-bg)",
    color: "var(--error-text)",
    border: "var(--error-border)",
  },
  info: {
    bg: "var(--interactive-light)",
    color: "var(--interactive)",
    border: "var(--interactive-border)",
  },
};

export default function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
      style={{
        backgroundColor: styles.bg,
        color: styles.color,
        borderColor: styles.border,
      }}
    >
      {children}
    </span>
  );
}
