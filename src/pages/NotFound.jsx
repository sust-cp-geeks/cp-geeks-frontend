import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <h1 style={{
        fontSize: '6rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #A5E8DE, #60a5fa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
        lineHeight: 1,
      }}>404</h1>
      <p style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: '1rem',
        marginBottom: '0.5rem',
      }}>Page Not Found</p>
      <p style={{
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: '2rem',
        maxWidth: '400px',
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/news" style={{
        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
        color: '#0f172a',
        padding: '0.75rem 2rem',
        borderRadius: '9999px',
        fontWeight: 700,
        fontSize: '1rem',
        textDecoration: 'none',
        boxShadow: '0 4px 15px rgba(165, 232, 222, 0.3)',
        transition: 'all 0.3s ease',
      }}>
        Go Home
      </Link>
    </div>
  );
}
