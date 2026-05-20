import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import News from './pages/News';
import Announcements from './pages/Announcements';
import Contest from './pages/Contest';
import Discussion from './pages/Discussion';
import Profile from './pages/Profile';
import Events from './pages/Events';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/news" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/news" element={<News />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/contest" element={<Contest />} />
            <Route path="/discussion" element={<Discussion />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/events" element={<Events />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
