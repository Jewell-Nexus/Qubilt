import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shell/Sidebar';
import { TopBar } from '@/shell/TopBar';
import { CommandPalette } from '@/shell/CommandPalette';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
