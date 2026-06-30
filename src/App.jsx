import React, { useRef, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import RightSidebar from './components/RightSidebar';

const Auth = lazy(() => import('./pages/Auth'));
const ManualVerification = lazy(() => import('./pages/ManualVerification'));
const News = lazy(() => import('./pages/News'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Contest = lazy(() => import('./pages/Contest'));
const Discussion = lazy(() => import('./pages/Discussion'));
const Codeforces = lazy(() => import('./pages/Codeforces'));
const Profile = lazy(() => import('./pages/Profile'));
const Events = lazy(() => import('./pages/Events'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const Problems = lazy(() => import('./pages/Problems'));
const VjudgeRanker = lazy(() => import('./pages/VjudgeRanker'));

const pageVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 50 : -50,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -50 : 50,
    transition: { duration: 0.3, ease: 'easeInOut' }
  })
};

const AnimatedPage = ({ children, direction }) => (
  <motion.div
    custom={direction}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {children}
  </motion.div>
);

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
  '/auth/manual-verification': 11,
};

function AppContent() {
  const location = useLocation();
  const prevOrderRef = useRef(1);

  const getBaseRoute = (path) => {
    if (path.startsWith('/profile')) return '/profile';
    if (path.startsWith('/events/')) return '/events';
    return path;
  };

  const currentPath = getBaseRoute(location.pathname);
  const currentOrder = routeOrder[currentPath] || 0;
  
  const direction = currentOrder >= prevOrderRef.current ? 1 : -1;

  useEffect(() => {
    prevOrderRef.current = currentOrder;
  }, [currentOrder]);

  return (
    <div className="app-container">
      <Navbar />
      <div className="layout-container">
        <main className="main-content" style={{ overflowX: 'hidden' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <Suspense fallback={<div className="page-loader"><div className="spinner"></div></div>}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Navigate to="/news" replace />} />
                <Route path="/auth" element={<AnimatedPage direction={direction}><Auth /></AnimatedPage>} />
                <Route path="/auth/manual-verification" element={<AnimatedPage direction={direction}><ManualVerification /></AnimatedPage>} />
                <Route path="/news" element={<AnimatedPage direction={direction}><News /></AnimatedPage>} />
                <Route path="/announcements" element={<AnimatedPage direction={direction}><Announcements /></AnimatedPage>} />
                <Route path="/contest" element={<AnimatedPage direction={direction}><Contest /></AnimatedPage>} />
                <Route path="/discussion" element={<AnimatedPage direction={direction}><Discussion /></AnimatedPage>} />
                <Route path="/problems" element={<AnimatedPage direction={direction}><Problems /></AnimatedPage>} />
                <Route path="/codeforces" element={<AnimatedPage direction={direction}><Codeforces /></AnimatedPage>} />
                <Route path="/profile" element={<AnimatedPage direction={direction}><Profile /></AnimatedPage>} />
                <Route path="/profile/:id" element={<AnimatedPage direction={direction}><Profile /></AnimatedPage>} />
                <Route path="/events" element={<AnimatedPage direction={direction}><Events /></AnimatedPage>} />
                <Route path="/events/:id" element={<AnimatedPage direction={direction}><EventDetails /></AnimatedPage>} />
                <Route path="/vjudge-ranker" element={<AnimatedPage direction={direction}><VjudgeRanker /></AnimatedPage>} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
