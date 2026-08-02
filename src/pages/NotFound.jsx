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
        color: 'var(--accent)',
        margin: 0,
        lineHeight: 1,
      }}>404</h1>
      <p style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--text-normal)',
        marginTop: '1rem',
        marginBottom: '0.5rem',
      }}>Page Not Found</p>
      <p style={{
        color: 'var(--text-muted-more)',
        marginBottom: '2rem',
        maxWidth: '400px',
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/announcements" style={{
        background: 'var(--primary-color)',
        color: 'var(--btn-primary-text)',
        padding: '0.75rem 2rem',
        borderRadius: '9999px',
        fontWeight: 700,
        fontSize: '1rem',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
      }}>
        Go Home
      </Link>
    </div>
  );
}
