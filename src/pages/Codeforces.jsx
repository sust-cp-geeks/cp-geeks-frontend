import React, { useState, useEffect } from 'react';
import './Codeforces.css';

const Codeforces = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/cf/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setLeaderboard(result.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || errorData.message || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError('Could not connect to the server');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchProfile = async (userId) => {
    setLoadingProfile(true);
    setSelectedUserId(userId);
    setProfileStats(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/cf/profile/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setProfileStats(result.data);
      } else {
        setError('Failed to fetch profile stats');
      }
    } catch (err) {
      setError('Could not connect to the server');
    } finally {
      setLoadingProfile(false);
    }
  };

  const getRankColor = (rank) => {
    if (!rank) return '#fff';
    const l = rank.toLowerCase();
    if (l.includes('newbie')) return 'gray';
    if (l.includes('pupil')) return 'green';
    if (l.includes('specialist')) return '#03a89e'; // cyan
    if (l.includes('expert')) return 'blue';
    if (l.includes('candidate master')) return '#a0a'; // violet
    if (l.includes('master')) return '#ff8c00'; // orange
    if (l.includes('grandmaster')) return 'red';
    return '#fff';
  };

  const renderSolveCountBars = (periodData) => {
    if (!periodData) return null;
    const maxVal = Math.max(...Object.values(periodData.buckets));

    return (
      <div className="solve-bars-container">
        <h4>Total Solves: {periodData.total}</h4>
        <div className="solve-bars">
          {Object.entries(periodData.buckets).map(([bucket, count]) => (
            <div key={bucket} className="solve-bar-wrapper">
              <span className="bucket-label">{bucket}</span>
              <div className="bar-track">
                <div 
                  className="bar-fill" 
                  style={{ width: `${maxVal > 0 ? (count / maxVal) * 100 : 0}%` }}
                >
                  <span className="bar-count">{count > 0 ? count : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="cf-page-wrapper">
      <div className="cf-header">
        <h1>Codeforces Dashboard</h1>
        <p>View community leaderboard and individual solve statistics</p>
      </div>
      
      {error && <div className="cf-error">{error}</div>}

      <div className="cf-content">
        <div className="cf-leaderboard-section">
          <h2>Leaderboard</h2>
          {loadingLeaderboard ? (
            <div className="loading-spinner">Loading...</div>
          ) : (
            <div className="table-responsive">
              <table className="cf-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Handle</th>
                    <th>Rating</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user) => (
                    <tr key={user.user_id}>
                      <td>#{user.rank}</td>
                      <td>{user.name}</td>
                      <td style={{ color: getRankColor(user.current_rank || 'unrated') }}>
                        {user.codeforces_handle}
                      </td>
                      <td>{user.current_rating || 'Unrated'}</td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => fetchProfile(user.user_id)}
                        >
                          View Stats
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedUserId && (
          <div className="cf-profile-section">
            <button className="close-profile-btn" onClick={() => setSelectedUserId(null)}>
              &times;
            </button>
            {loadingProfile ? (
              <div className="loading-spinner">Fetching detailed stats from Codeforces...</div>
            ) : profileStats ? (
              <div className="profile-stats-card">
                <div className="profile-stats-header">
                  <h2 style={{ color: getRankColor(profileStats.current_rank) }}>
                    {profileStats.codeforces_handle}
                  </h2>
                  <div className="rank-badges">
                    <span className="badge current-badge">
                      Rating: {profileStats.current_rating || 'Unrated'} ({profileStats.current_rank || 'N/A'})
                    </span>
                    <span className="badge max-badge">
                      Max: {profileStats.max_rating || 'Unrated'} ({profileStats.max_rank || 'N/A'})
                    </span>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stats-box">
                    <h3>Last 1 Month</h3>
                    {renderSolveCountBars(profileStats.solve_counts.last_1_month)}
                  </div>
                  <div className="stats-box">
                    <h3>Last 6 Months</h3>
                    {renderSolveCountBars(profileStats.solve_counts.last_6_months)}
                  </div>
                  <div className="stats-box">
                    <h3>Last 1 Year</h3>
                    {renderSolveCountBars(profileStats.solve_counts.last_1_year)}
                  </div>
                </div>

                <div className="recent-contests-section">
                  <h3>Recent Contests</h3>
                  {profileStats.recent_contests.length > 0 ? (
                    <div className="contests-list">
                      {profileStats.recent_contests.map((c, idx) => (
                        <div key={idx} className="contest-item">
                          <div className="contest-name">{c.contest_name}</div>
                          <div className="contest-details">
                            <span>Rank: {c.rank}</span>
                            <span className={c.rating_change >= 0 ? 'positive-change' : 'negative-change'}>
                              {c.rating_change > 0 ? '+' : ''}{c.rating_change}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No recent contests.</p>
                  )}
                </div>
              </div>
            ) : (
              <div>Could not load profile stats.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Codeforces;
