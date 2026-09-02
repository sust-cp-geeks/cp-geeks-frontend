import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_URL } from '../api';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';
  const role = localStorage.getItem('role') || '';
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
        } else {
          // Token is likely invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          setProfileName('');
          lastFetchedTokenRef.current = null;
        }
      })
      .catch(console.error);
    } else if (!token) {
      // Name is only rendered when a token exists, so no state reset needed
      lastFetchedTokenRef.current = null;
    }
  }, [token]);

  // Close menu when navigating
  useEffect(() => {
    const timer = setTimeout(() => setMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setProfileName('');
    lastFetchedTokenRef.current = null;
    navigate('/');
  }, [navigate]);

  return (
    <>
      {menuOpen && (
        <div 
          className="navbar-overlay" 
          onClick={() => setMenuOpen(false)} 
          aria-hidden="true"
        />
      )}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <Link to="/">
              {/* The mark is dark navy, which vanishes against the dark navbar,
                  so the dark theme gets the light-on-transparent variant. */}
              <img
                src={theme === 'light' ? '/logo.png' : '/logo-dark.png'}
                alt="Logo"
                className="navbar-logo-img"
              />
              <span>SUST CPGEEKS</span>
            </Link>
          </div>
          
          <ul className={`navbar-links${menuOpen ? ' open' : ''}`}>
            <li className={location.pathname === '/announcements' ? 'active' : ''}>
              <Link to="/announcements" onClick={() => setMenuOpen(false)}>Announcements</Link>
            </li>
            <li className={location.pathname === '/problems' ? 'active' : ''}>
              <Link to="/problems" onClick={() => setMenuOpen(false)}>Problems</Link>
            </li>
            <li className={location.pathname === '/codeforces' ? 'active' : ''}>
              <Link to="/codeforces" onClick={() => setMenuOpen(false)}>Codeforces</Link>
            </li>
            <li className={location.pathname === '/events' ? 'active' : ''}>
              <Link to="/events" onClick={() => setMenuOpen(false)}>Events</Link>
            </li>
            <li className={location.pathname === '/vjudge-ranker' ? 'active' : ''}>
              <Link to="/vjudge-ranker" onClick={() => setMenuOpen(false)}>Vjudge Mesh</Link>
            </li>
            {role === 'admin' && (
              <li className={location.pathname === '/admin/users' ? 'active' : ''}>
                <Link to="/admin/users" onClick={() => setMenuOpen(false)}>Admin</Link>
              </li>
            )}

            <li className="mobile-drawer-auth">
              {token ? (
                <div className="mobile-auth-wrapper">
                  <div className="mobile-user-info">
                    <span className="user-greeting">Welcome, {profileName || 'Member'}</span>
                  </div>
                  <div className="mobile-auth-actions">
                    <Link to="/profile" className="mobile-profile-link" onClick={() => setMenuOpen(false)}>
                      My Profile
                    </Link>
                    <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="auth-logout-btn">
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/auth" className="auth-btn mobile-login-btn" onClick={() => setMenuOpen(false)}>
                  Login / Register
                </Link>
              )}
            </li>
          </ul>

          <div className="navbar-auth">
            <button 
              className="theme-toggle-btn" 
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle light/dark theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
              <span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            {token ? (
              <div className="auth-user-info desktop-auth">
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
              <Link to="/auth" className="auth-btn desktop-auth">Login/Register</Link>
            )}
          </div>

          <button
            className={`navbar-toggle${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default React.memo(Navbar);
