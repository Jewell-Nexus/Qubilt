import { lazy, memo, Suspense, type ComponentType } from 'react';
import { type LucideProps } from 'lucide-react';

interface LucideIconProps {
  name: string;
  size?: number;
  className?: string;
}

const iconCache = new Map<string, ComponentType<LucideProps>>();

function getLazyIcon(name: string) {
  if (iconCache.has(name)) {
    return iconCache.get(name)!;
  }
  const LazyIcon = lazy(() =>
    import('lucide-react').then((mod) => {
      const Icon = mod[name as keyof typeof mod] as ComponentType<LucideProps> | undefined;
      if (!Icon) {
        return { default: mod.CircleHelp as ComponentType<LucideProps> };
      }
      return { default: Icon };
    }),
  );
  iconCache.set(name, LazyIcon);
  return LazyIcon;
}

export const LucideIcon = memo(function LucideIcon({ name, size = 16, className }: LucideIconProps) {
  const Icon = getLazyIcon(name);
  return (
    <Suspense fallback={<div style={{ width: size, height: size }} />}>
      <Icon size={size} className={className} />
    </Suspense>
  );
});
