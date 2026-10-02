import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/guards/ProtectedRoute';
import GuestRoute from './components/guards/GuestRoute';
import AppShell from './components/layout/AppShell';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import ProblemListPage from './features/problems/pages/ProblemListPage';
import ProblemDetailPage from './features/problems/pages/ProblemDetailPage';
import RevisionsPage from './features/revisions/pages/RevisionsPage';
import AnalyticsPage from './features/analytics/pages/AnalyticsPage';
import GoalsPage from './features/goals/pages/GoalsPage';
import RoadmapsPage from './features/roadmaps/pages/RoadmapsPage';
import RoadmapDetailPage from './features/roadmaps/pages/RoadmapDetailPage';
import AchievementsPage from './features/achievements/pages/AchievementsPage';
import SettingsPage from './features/settings/pages/SettingsPage';
import ImportExportPage from './features/settings/pages/ImportExportPage';
import { ROUTES } from './config/routes';
// ── React Query Client ────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── App ───────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Guest Routes */}
              <Route path={ROUTES.LOGIN} element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path={ROUTES.REGISTER} element={<GuestRoute><RegisterPage /></GuestRoute>} />

              {/* Protected Routes */}
              <Route
                path={ROUTES.APP}
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="problems" element={<ProblemListPage />} />
                <Route path="problems/:id" element={<ProblemDetailPage />} />
                <Route path="revisions" element={<RevisionsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="roadmaps" element={<RoadmapsPage />} />
                <Route path="roadmaps/:id" element={<RoadmapDetailPage />} />
                <Route path="achievements" element={<AchievementsPage />} />
                <Route path="import" element={<ImportExportPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            </Routes>
          </BrowserRouter>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg, #333)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: 'var(--accent-success)', secondary: '#fff' } },
              error: { iconTheme: { primary: 'var(--accent-error)', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
