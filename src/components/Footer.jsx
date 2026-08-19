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
        </div>
      </div>
    </footer>
  );
}

export default React.memo(Footer);

