import { useAuth0 } from '@auth0/auth0-react';
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Profile from './components/Profile';
import { GuestRoute } from './routes/GuestRoute';
import { HomeRoute } from './routes/HomeRoute';
import { LoadingRoute } from './routes/LoadingRoute';
import { LoginRoute } from './routes/LoginRoute';
import { LogoutRoute } from './routes/LogoutRoute';
import { NotFoundRoute } from './routes/NotFoundRoute';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingRoute />

  return isAuthenticated ? children : <Navigate to="/" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/guest" element={<GuestRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/logout" element={<LogoutRoute />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
