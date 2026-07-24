import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-simple-content">
          <span className="footer-copyright">© {currentYear} CPGEEKS. All rights reserved.</span>
          <div className="footer-simple-links">
            <Link to="/announcements">About</Link>
            <Link to="/discussion">Resources</Link>
            <Link to="/announcements">Announcements</Link>
            <Link to="/contest">Contest</Link>
            <Link to="/problems">Problems</Link>
            <Link to="/codeforces">Codeforces</Link>
            <Link to="/events">Events</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default React.memo(Footer);

