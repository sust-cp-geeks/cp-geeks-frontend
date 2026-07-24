import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Megaphone, Trophy, Code2, BarChart2, Calendar, User, KeyRound } from 'lucide-react';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  // Hide bottom nav on login/register page if desired, or keep it visible
  if (location.pathname === '/auth') return null;

  const navItems = [
    {
      path: '/announcements',
      label: 'Announce',
      icon: Megaphone,
    },
    {
      path: '/contest',
      label: 'Contest',
      icon: Trophy,
    },
    {
      path: '/problems',
      label: 'Problems',
      icon: Code2,
    },
    {
      path: '/codeforces',
      label: 'Codeforces',
      icon: BarChart2,
    },
    {
      path: '/events',
      label: 'Events',
      icon: Calendar,
    },
    {
      path: token ? '/profile' : '/auth',
      label: token ? 'Profile' : 'Login',
      icon: token ? User : KeyRound,
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = 
            location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path) && item.path !== '/auth');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrapper">
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              <span className="mobile-nav-label">{item.label}</span>
              {isActive && <span className="mobile-nav-active-dot" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default React.memo(MobileBottomNav);
