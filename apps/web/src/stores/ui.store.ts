import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  commandPaletteOpen: boolean;
  activePage: string;
}

interface UIActions {
  toggleSidebar(): void;
  setSidebarCollapsed(v: boolean): void;
  setTheme(t: Theme): void;
  openCommandPalette(): void;
  closeCommandPalette(): void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        sidebarCollapsed: false,
        theme: 'system',
        commandPaletteOpen: false,
        activePage: '',

        toggleSidebar() {
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
        },
        setSidebarCollapsed(v: boolean) {
          set({ sidebarCollapsed: v });
        },
        setTheme(t: Theme) {
          set({ theme: t });
        },
        openCommandPalette() {
          set({ commandPaletteOpen: true });
        },
        closeCommandPalette() {
          set({ commandPaletteOpen: false });
        },
      }),
      {
        name: 'qubilt-ui',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
      },
    ),
    { name: 'ui' },
  ),
);
