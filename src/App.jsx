import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import RightSidebar from './components/RightSidebar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ScrollRevealObserver from './components/ScrollRevealObserver';
import ScrollProgressBar from './components/ScrollProgressBar';
import OfflineBanner from './components/OfflineBanner';
import { ToastProvider, useToast } from './components/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { onSessionEnded } from './api';

const Auth = lazy(() => import('./pages/Auth'));
const ManualSignup = lazy(() => import('./pages/ManualSignup'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const AwaitingApproval = lazy(() => import('./pages/AwaitingApproval'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Contest = lazy(() => import('./pages/Contest'));
const Discussion = lazy(() => import('./pages/Discussion'));
const Codeforces = lazy(() => import('./pages/Codeforces'));
const Profile = lazy(() => import('./pages/Profile'));
const Events = lazy(() => import('./pages/Events'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const Problems = lazy(() => import('./pages/Problems'));
const VjudgeRanker = lazy(() => import('./pages/VjudgeRanker'));
const NotFound = lazy(() => import('./pages/NotFound'));

const routeOrder = {
  '/news': 1,
  '/announcements': 2,
  '/contest': 3,
  '/discussion': 4,
  '/problems': 5,
  '/codeforces': 6,
  '/events': 7,
  '/vjudge-ranker': 8,
  '/profile': 9,
  '/auth': 10,
  '/auth/verify': 12,
  '/auth/pending': 13,
  '/admin/users': 14,
};

// Lightweight CSS-animated page wrapper (replaces framer-motion)
const AnimatedPage = ({ children, direction, locationKey }) => (
  <div className="animated-page" data-direction={direction} key={locationKey}>
    {children}
  </div>
);

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useToast();

  // A revoked or expired session is detected globally (see installSessionGuard
  // in api.js); this is where it becomes a message and a redirect.
  useEffect(() => onSessionEnded((message) => {
    showToast(message, 'error');
    navigate('/auth', { replace: true });
  }), [navigate, showToast]);

  // Reset scroll on route change; instant so it doesn't fight smooth-scroll CSS
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  const getBaseRoute = (path) => {
    if (path.startsWith('/profile')) return '/profile';
    if (path.startsWith('/events/')) return '/events';
    return path;
  };

  const currentPath = getBaseRoute(location.pathname);

  // "Adjust state during render" pattern — derives slide direction from the
  // previous route without refs, which is safe under concurrent rendering.
  const [prevPath, setPrevPath] = useState(currentPath);
  const [direction, setDirection] = useState(1);

  if (currentPath !== prevPath) {
    const prevOrder = routeOrder[prevPath] || 0;
    const currentOrder = routeOrder[currentPath] || 0;
    setDirection(currentOrder >= prevOrder ? 1 : -1);
    setPrevPath(currentPath);
  }

  return (
    <div className="app-container">
      <ScrollProgressBar />
      <OfflineBanner />
      <Navbar />
      <div className="layout-container">
        <main className="main-content" style={{ overflowX: 'hidden' }}>
          <ErrorBoundary>
            <Suspense fallback={<div className="page-loader"><div className="spinner"></div></div>}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Navigate to="/announcements" replace />} />
                <Route path="/auth" element={<AnimatedPage direction={direction} locationKey={location.pathname}><Auth /></AnimatedPage>} />
                <Route path="/auth/manual-signup" element={<AnimatedPage direction={direction} locationKey={location.pathname}><ManualSignup /></AnimatedPage>} />
                <Route path="/auth/verify" element={<AnimatedPage direction={direction} locationKey={location.pathname}><VerifyOtp /></AnimatedPage>} />
                <Route path="/auth/pending" element={<AnimatedPage direction={direction} locationKey={location.pathname}><AwaitingApproval /></AnimatedPage>} />
                <Route path="/admin/users" element={<AnimatedPage direction={direction} locationKey={location.pathname}><AdminUsers /></AnimatedPage>} />
                <Route path="/news" element={<Navigate to="/announcements" replace />} />
                <Route path="/announcements" element={<AnimatedPage direction={direction} locationKey={location.pathname}><Announcements /></AnimatedPage>} />
                <Route path="/contest" element={<AnimatedPage direction={direction} locationKey={location.pathname}><Contest /></AnimatedPage>} />
                <Route path="/discussion" element={<AnimatedPage direction={direction} locationKey={location.pathname}><Discussion /></AnimatedPage>} />
                <Route path="/problems" element={<AnimatedPage direction={direction} locationKey={location.pathname}><Problems /></AnimatedPage>} />
                <Route path="/codeforces" element={<AnimatedPage direction={direction} locationKey={location.pathname}><Codeforces /></AnimatedPage>} />
                <Route path="/profile" element={<AnimatedPage direction={direction} locationKey={location.pathname}><Profile /></AnimatedPage>} />
                <Route path="/profile/:id" element={<AnimatedPage direction={direction} locationKey={location.pathname}><Profile /></AnimatedPage>} />
                <Route path="/events" element={<AnimatedPage direction={direction} locationKey={location.pathname}><Events /></AnimatedPage>} />
                <Route path="/events/:id" element={<AnimatedPage direction={direction} locationKey={location.pathname}><EventDetails /></AnimatedPage>} />
                <Route path="/vjudge-ranker" element={<AnimatedPage direction={direction} locationKey={location.pathname}><VjudgeRanker /></AnimatedPage>} />
                <Route path="*" element={<AnimatedPage direction={direction} locationKey={location.pathname}><NotFound /></AnimatedPage>} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <RightSidebar />
      </div>
      <Footer />
      <MobileBottomNav />
      <ScrollToTop />
      <ScrollRevealObserver />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
}

export default App;
