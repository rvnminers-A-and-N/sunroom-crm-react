import { createBrowserRouter, redirect } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from '@core/stores/auth-store';

function requireAuth() {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) return redirect('/auth/login');
  return null;
}

function requireAdmin() {
  const auth = requireAuth();
  if (auth) return auth;
  const { user } = useAuthStore.getState();
  if (user?.role !== 'Admin') return redirect('/dashboard');
  return null;
}

const AppLayout = lazy(() => import('@layout/app-layout'));
const LoginPage = lazy(() => import('@features/auth/login-page'));
const RegisterPage = lazy(() => import('@features/auth/register-page'));
const DashboardPage = lazy(
  () => import('@features/dashboard/dashboard-page'),
);
const ContactListPage = lazy(
  () => import('@features/contacts/contact-list-page'),
);
const ContactDetailPage = lazy(
  () => import('@features/contacts/contact-detail-page'),
);
const CompanyListPage = lazy(
  () => import('@features/companies/company-list-page'),
);
const CompanyDetailPage = lazy(
  () => import('@features/companies/company-detail-page'),
);
const DealListPage = lazy(() => import('@features/deals/deal-list-page'));
const DealPipelinePage = lazy(
  () => import('@features/deals/deal-pipeline-page'),
);
const DealDetailPage = lazy(() => import('@features/deals/deal-detail-page'));
const ActivityListPage = lazy(
  () => import('@features/activities/activity-list-page'),
);
const AiPanelPage = lazy(() => import('@features/ai/ai-panel-page'));
const ProfilePage = lazy(() => import('@features/settings/profile-page'));
const UserManagementPage = lazy(
  () => import('@features/admin/user-management-page'),
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sr-primary border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        element: (
          <SuspenseWrapper>
            <LoginPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'register',
        element: (
          <SuspenseWrapper>
            <RegisterPage />
          </SuspenseWrapper>
        ),
      },
      { index: true, loader: () => redirect('login') },
    ],
  },
  {
    path: '/',
    element: (
      <SuspenseWrapper>
        <AppLayout />
      </SuspenseWrapper>
    ),
    loader: requireAuth,
    children: [
      { index: true, loader: () => redirect('dashboard') },
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'contacts',
        element: (
          <SuspenseWrapper>
            <ContactListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'contacts/:id',
        element: (
          <SuspenseWrapper>
            <ContactDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'companies',
        element: (
          <SuspenseWrapper>
            <CompanyListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'companies/:id',
        element: (
          <SuspenseWrapper>
            <CompanyDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'deals',
        element: (
          <SuspenseWrapper>
            <DealListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'deals/pipeline',
        element: (
          <SuspenseWrapper>
            <DealPipelinePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'deals/:id',
        element: (
          <SuspenseWrapper>
            <DealDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'activities',
        element: (
          <SuspenseWrapper>
            <ActivityListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'ai',
        element: (
          <SuspenseWrapper>
            <AiPanelPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings',
        element: (
          <SuspenseWrapper>
            <ProfilePage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin',
        loader: requireAdmin,
        element: (
          <SuspenseWrapper>
            <UserManagementPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  { path: '*', loader: () => redirect('/') },
]);
