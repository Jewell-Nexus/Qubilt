import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-raised">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>

      {/* Right: Brand panel (hidden on mobile) */}
      <div
        className="hidden md:flex flex-1 items-center justify-center p-12"
        style={{
          background: 'linear-gradient(135deg, var(--color-neutral-950), var(--color-purple-900), var(--color-purple-800))',
        }}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold text-white">Q</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Qubilt</h1>
            <p className="text-white/70 text-sm max-w-xs">
              Build your business, block by block.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
