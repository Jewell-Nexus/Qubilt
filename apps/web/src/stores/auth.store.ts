import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login(email: string, password: string): Promise<void>;
  register(dto: { email: string; password: string; displayName: string }): Promise<void>;
  logout(): Promise<void>;
  refreshTokens(): Promise<boolean>;
  setUser(user: User): void;
  initialize(): Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: true,

        async login(email: string, password: string) {
          const { post } = await import('@/lib/api');
          const data = await post<{
            accessToken: string;
            refreshToken: string;
            user: User;
          }>('/auth/login', { email, password });
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
            isAuthenticated: true,
          });
        },

        async register(dto) {
          const { post } = await import('@/lib/api');
          const data = await post<{
            accessToken: string;
            refreshToken: string;
            user: User;
          }>('/auth/register', dto);
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
            isAuthenticated: true,
          });
        },

        async logout() {
          try {
            const { post } = await import('@/lib/api');
            await post('/auth/logout');
          } catch {
            // best-effort
          }
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        },

        async refreshTokens(): Promise<boolean> {
          const { refreshToken } = get();
          if (!refreshToken) return false;
          try {
            const { post } = await import('@/lib/api');
            const data = await post<{
              accessToken: string;
              refreshToken: string;
            }>('/auth/refresh', { refreshToken });
            set({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            });
            return true;
          } catch {
            return false;
          }
        },

        setUser(user: User) {
          set({ user });
        },

        async initialize() {
          const { accessToken } = get();
          if (!accessToken) {
            set({ isLoading: false });
            return;
          }
          try {
            const { get: apiGet } = await import('@/lib/api');
            const user = await apiGet<User>('/auth/me');
            set({ user, isAuthenticated: true, isLoading: false });
          } catch {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },
      }),
      {
        name: 'qubilt-auth',
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        }),
      },
    ),
    { name: 'auth' },
  ),
);
