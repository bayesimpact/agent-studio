import { GuestRoute } from '@/routes/GuestRoute';
import { HomeRoute } from '@/routes/HomeRoute';
import { LoginRoute } from '@/routes/LoginRoute';
import { LogoutRoute } from '@/routes/LogoutRoute';
import { NotFoundRoute } from '@/routes/NotFoundRoute';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DashboardRoute } from './DashboardRoute';

export function Router() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/guest" element={<GuestRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  </BrowserRouter>
}
