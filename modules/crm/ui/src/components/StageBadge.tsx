interface StageBadgeProps {
  name: string;
  color: string | null;
  className?: string;
}

export function StageBadge({ name, color, className }: StageBadgeProps) {
  const bg = color ? `${color}26` : '#6B728026';
  const text = color ?? '#6B7280';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className ?? ''}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {name}
    </span>
  );
}
