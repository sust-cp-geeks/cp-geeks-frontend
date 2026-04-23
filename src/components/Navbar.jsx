import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [role, setRole] = useState('');
  useEffect(() => {
    const stored = localStorage.getItem('role') || '';
    setRole(stored);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">SUST CPGEEKS</Link>
        </div>
        
        <ul className="navbar-links">
          <li className={location.pathname === '/news' ? 'active' : ''}>
            <Link to="/news">News</Link>
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
          <li className={location.pathname === '/events' ? 'active' : ''}>
            <Link to="/events">Events</Link>
          </li>
        </ul>

        <div className="navbar-auth">
          {role === 'admin' && <Link to="/admin" className="create-post-btn">Create Post</Link>}
          <Link to="/auth" className="auth-btn">Login/Register</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
