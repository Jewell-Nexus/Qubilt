import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AppShell } from '@/shell/AppShell';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { TwoFactor } from '@/pages/auth/TwoFactor';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Users } from '@/pages/admin/Users';
import { Roles } from '@/pages/admin/Roles';
import { Modules } from '@/pages/admin/Modules';
import { Settings } from '@/pages/admin/Settings';
import { AuditLog } from '@/pages/admin/AuditLog';
import { MyPage } from '@/pages/dashboard/MyPage';
import { NotificationCenter } from '@/pages/NotificationCenter';
import { ProjectList } from '@/pages/projects/ProjectList';
import { ProjectLayout } from '@/pages/projects/ProjectLayout';
import { NotFound } from '@/pages/NotFound';

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

function ProjectOverview() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-text-secondary">Project overview — modules will populate this view.</p>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-text-secondary">{title} — coming soon.</p>
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
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ForgotPassword /> },
      { path: '/2fa', element: <TwoFactor /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <MyPage /> },
          { path: '/notifications', element: <NotificationCenter /> },
          { path: '/projects', element: <ProjectList /> },
          {
            path: '/projects/:projectId',
            element: <ProjectLayout />,
            children: [
              { index: true, element: <ProjectOverview /> },
              { path: '*', element: <ProjectOverview /> },
            ],
          },
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/users" replace /> },
              { path: 'users', element: <Users /> },
              { path: 'roles', element: <Roles /> },
              { path: 'modules', element: <Modules /> },
              { path: 'marketplace', element: <ComingSoon title="Marketplace" /> },
              { path: 'themes', element: <ComingSoon title="Themes" /> },
              { path: 'settings', element: <Settings /> },
              { path: 'audit-log', element: <AuditLog /> },
              { path: 'webhooks', element: <ComingSoon title="Webhooks" /> },
            ],
          },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
