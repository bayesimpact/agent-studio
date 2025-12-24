import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Profile from './components/Profile';
import { Toaster } from './components/Sonner';
import { useInitApi } from './hooks/use-init-api';
import { GuestRoute } from './routes/GuestRoute';
import { HomeRoute } from './routes/HomeRoute';
import { LoginRoute } from './routes/LoginRoute';
import { LogoutRoute } from './routes/LogoutRoute';
import { NotFoundRoute } from './routes/NotFoundRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';


function App() {
  useInitApi();
  return (
    <>
      <Toaster />
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
    </>
  );
}

export default App;
