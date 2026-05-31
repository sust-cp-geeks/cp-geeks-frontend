import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    setRole(localStorage.getItem('role') || '');
    setToken(localStorage.getItem('token') || '');
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setRole('');
    setToken('');
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
        
        <ul className="navbar-links">
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
            <>
              <Link to="/profile" className="auth-btn">Profile</Link>
              <button 
                onClick={handleLogout} 
                className="auth-btn btn-outline"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="auth-btn">Login/Register</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
