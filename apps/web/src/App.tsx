import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useUser, UserButton } from '@clerk/react';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function NavHeader() {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 bg-feed-bg/90 backdrop-blur-md border-b border-feed-border">
      <div className="max-w-[600px] mx-auto flex items-center justify-between px-4 h-[53px]">
        <button
          onClick={() => navigate('/')}
          className="text-feed-text font-bold text-lg hover:text-feed-accent transition-colors"
        >
          DoomSchooling
        </button>
        <div className="flex items-center gap-3">
          <span className="text-feed-text-secondary text-sm hidden sm:block">
            {user?.primaryEmailAddress?.emailAddress}
          </span>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
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
      <NavHeader />
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
