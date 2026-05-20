import React, { useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import News from './pages/News';
import Announcements from './pages/Announcements';
import Contest from './pages/Contest';
import Discussion from './pages/Discussion';
import Codeforces from './pages/Codeforces';
import Profile from './pages/Profile';
import Events from './pages/Events';
import Problems from './pages/Problems';

const pageVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 30 : -30,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -30 : 30,
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
  '/profile': 8,
  '/auth': 9,
};

function AppContent() {
  const location = useLocation();
  const prevOrderRef = useRef(1);

  const getBaseRoute = (path) => {
    if (path.startsWith('/profile')) return '/profile';
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
      <main className="main-content" style={{ overflowX: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/news" replace />} />
            <Route path="/auth" element={<AnimatedPage direction={direction}><Auth /></AnimatedPage>} />
            <Route path="/news" element={<AnimatedPage direction={direction}><News /></AnimatedPage>} />
            <Route path="/announcements" element={<AnimatedPage direction={direction}><Announcements /></AnimatedPage>} />
            <Route path="/contest" element={<AnimatedPage direction={direction}><Contest /></AnimatedPage>} />
            <Route path="/discussion" element={<AnimatedPage direction={direction}><Discussion /></AnimatedPage>} />
            <Route path="/problems" element={<AnimatedPage direction={direction}><Problems /></AnimatedPage>} />
            <Route path="/codeforces" element={<AnimatedPage direction={direction}><Codeforces /></AnimatedPage>} />
            <Route path="/profile" element={<AnimatedPage direction={direction}><Profile /></AnimatedPage>} />
            <Route path="/profile/:id" element={<AnimatedPage direction={direction}><Profile /></AnimatedPage>} />
            <Route path="/events" element={<AnimatedPage direction={direction}><Events /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </main>
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
