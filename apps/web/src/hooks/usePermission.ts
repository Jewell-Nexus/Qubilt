import { useAuthStore } from '@/stores/auth.store';

export function usePermission(permission: string): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return user.permissions.includes(permission);
}
