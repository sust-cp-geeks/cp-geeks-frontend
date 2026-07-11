import { API_URL } from '../api';
import React, { useState, useEffect } from 'react';
import LeaderboardTable from './LeaderboardTable';

export default function EventStandings({ contestIds, title = "TFC Standings" }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contestIds || contestIds.length === 0) return;

    const fetchStandings = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/ranker/analyze`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title,
            contest_ids: contestIds,
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setResult(data.data);
        } else {
          setError(data.message || 'Failed to fetch standings');
        }
      } catch (err) {
        console.error(err);
        setError('Error connecting to backend for standings.');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [contestIds, title]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary-color)' }}>Loading TFC Standings...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
  if (!result) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <LeaderboardTable result={result} />
    </div>
  );
}
