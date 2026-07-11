import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { resources } from '@/config/resources';
import { ResourcePage } from '@/components/ResourcePage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MediaPage } from '@/pages/MediaPage';
import { UsersPage } from '@/pages/UsersPage';
import { QuizPage } from '@/pages/QuizPage';
import { MemoryPage } from '@/pages/MemoryPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {resources.map((config) => (
          <Route
            key={config.key}
            path={config.key}
            element={<ResourcePage config={config} />}
          />
        ))}

        <Route path="media" element={<MediaPage />} />

        <Route
          path="quiz"
          element={
            <ProtectedRoute roles={['admin']}>
              <QuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="memory"
          element={
            <ProtectedRoute roles={['admin']}>
              <MemoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
