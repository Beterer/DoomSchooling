import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BecuriPage from './pages/BecuriPage';
import BecuriAdminPage from './pages/BecuriAdminPage';
import { SiteHeader } from './components/ui/SiteHeader';
import { useAppAuth } from './lib/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAppAuth();
  const location = useLocation();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect_url=${redirectUrl}`} replace />;
  }

  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Public on purpose: she has no account and never needs one. */}
        <Route path="/becuri" element={<BecuriPage />} />
        <Route path="/becuri/admin" element={<BecuriAdminPage />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
