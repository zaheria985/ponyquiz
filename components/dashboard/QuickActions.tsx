import Link from "next/link";

interface QuickAction {
  href: string;
  icon: string;
  title: string;
  description: string;
  bgColor: string;
  iconBg: string;
}

const actions: QuickAction[] = [
  {
    href: "/flashcards",
    icon: "\u{1F4DA}",
    title: "Study Flashcards",
    description: "Review and memorize key terms",
    bgColor: "var(--interactive-light)",
    iconBg: "var(--interactive-medium)",
  },
  {
    href: "/practice",
    icon: "\u{1F3AF}",
    title: "Practice Quiz",
    description: "Test yourself without grades",
    bgColor: "var(--success-bg)",
    iconBg: "var(--success-border)",
  },
  {
    href: "/quiz",
    icon: "\u{1F4DD}",
    title: "Take a Test",
    description: "Graded quiz to track progress",
    bgColor: "var(--warning-bg)",
    iconBg: "var(--warning-border)",
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="rounded-card border shadow-card p-5 transition-shadow hover:shadow-card-lg block"
          style={{
            backgroundColor: action.bgColor,
            borderColor: "var(--border-light)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3"
            style={{ backgroundColor: action.iconBg }}
          >
            {action.icon}
          </div>
          <h3
            className="text-base font-semibold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {action.title}
          </h3>
          <p
            className="text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {action.description}
          </p>
        </Link>
      ))}
    </div>
  );
}
