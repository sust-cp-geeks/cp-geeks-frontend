import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_URL } from '../api';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';
  const [profileName, setProfileName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const lastFetchedTokenRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Only refetch profile when the token actually changes (login/logout)
    if (token && token !== lastFetchedTokenRef.current) {
      lastFetchedTokenRef.current = token;
      fetch(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setProfileName(data.data.name);
        }
      })
      .catch(console.error);
    } else if (!token && profileName !== '') {
      lastFetchedTokenRef.current = null;
      const id = setTimeout(() => setProfileName(''), 0);
      return () => clearTimeout(id);
    }
  }, [location.pathname, token, profileName]);

  // Close menu when navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setProfileName('');
    lastFetchedTokenRef.current = null;
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <img src="/logo.png" alt="Logo" className="navbar-logo-img" />
            <span>SUST CPGEEKS</span>
          </Link>
        </div>
        
        <ul className={`navbar-links${menuOpen ? ' open' : ''}`}>
          <li className={location.pathname === '/news' ? 'active' : ''}>
            <Link to="/news">News</Link>
          </li>
          <li className={location.pathname === '/announcements' ? 'active' : ''}>
            <Link to="/announcements">Announcements</Link>
          </li>
          <li className={location.pathname === '/contest' ? 'active' : ''}>
            <Link to="/contest">Contest</Link>
          </li>
          <li className={location.pathname === '/discussion' ? 'active' : ''}>
            <Link to="/discussion">Discussion</Link>
          </li>
          <li className={location.pathname === '/problems' ? 'active' : ''}>
            <Link to="/problems">Problems</Link>
          </li>
          <li className={location.pathname === '/codeforces' ? 'active' : ''}>
            <Link to="/codeforces">Codeforces</Link>
          </li>
          <li className={location.pathname === '/events' ? 'active' : ''}>
            <Link to="/events">Events</Link>
          </li>
          <li className={location.pathname === '/vjudge-ranker' ? 'active' : ''}>
            <Link to="/vjudge-ranker">Vjudge Mesh</Link>
          </li>
        </ul>

        <div className="navbar-auth">
          <button 
            className="theme-toggle-btn" 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle light/dark theme"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          {token ? (
            <div className="auth-user-info">
              <span className="user-greeting">Welcome, {profileName}</span>
              <span className="divider">|</span>
              <button 
                onClick={handleLogout} 
                className="auth-logout-btn"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="auth-btn">Login/Register</Link>
          )}
        </div>

        <button
          className={`navbar-toggle${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
