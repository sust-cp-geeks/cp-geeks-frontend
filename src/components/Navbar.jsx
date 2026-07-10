import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [token, setToken] = useState('');
  const [profileName, setProfileName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const lastFetchedTokenRef = useRef(null);

  useEffect(() => {
    const currentToken = localStorage.getItem('token') || '';
    const currentRole = localStorage.getItem('role') || '';
    setRole(currentRole);
    setToken(currentToken);

    // Only refetch profile when the token actually changes (login/logout)
    if (currentToken && currentToken !== lastFetchedTokenRef.current) {
      lastFetchedTokenRef.current = currentToken;
      fetch('http://localhost:8080/api/users/me', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setProfileName(data.data.name);
        }
      })
      .catch(console.error);
    } else if (!currentToken) {
      lastFetchedTokenRef.current = null;
      setProfileName('');
    }
  }, [location.pathname]);

  // Close menu when navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setRole('');
    setToken('');
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
            <Link to="/vjudge-ranker">VjudgeRanker</Link>
          </li>
        </ul>

        <div className="navbar-auth">
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
