import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function AuthLayout() {
  return <Outlet />;
}

function AppShell() {
  return (
    <div className="flex h-screen">
      {/* Sidebar and content area — built in later sessions */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function DashboardPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-text-secondary">Dashboard — coming soon</p>
    </div>
  );
}

function LoginPlaceholder() {
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-text-secondary">Login — coming soon</p>
    </div>
  );
}

function RegisterPlaceholder() {
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-text-secondary">Register — coming soon</p>
    </div>
  );
}

function ForgotPasswordPlaceholder() {
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-text-secondary">Forgot Password — coming soon</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPlaceholder /> },
      { path: '/register', element: <RegisterPlaceholder /> },
      { path: '/forgot-password', element: <ForgotPasswordPlaceholder /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPlaceholder /> },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
