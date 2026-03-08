import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-6xl font-bold text-text-tertiary">403</div>
      <p className="text-text-secondary">You don't have permission to access this page.</p>
    </div>
  );
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return fallback ?? <Forbidden />;
  }

  return <>{children}</>;
}
