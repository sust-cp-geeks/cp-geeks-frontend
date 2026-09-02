import { API_URL, parseApiDate } from '../api';
import React, { useState, useEffect, useRef } from 'react';
import './Codeforces.css';

import '../components/Skeleton.css';

const DEFAULT_LEADERBOARD = [
  { user_id: 1, rank: 1, name: "Tourist SUST", codeforces_handle: "tourist_sust", current_rating: 2450, current_rank: "Master" },
  { user_id: 2, rank: 2, name: "Mahir Ahmed", codeforces_handle: "mahir_dp", current_rating: 1890, current_rank: "Candidate Master" },
  { user_id: 3, rank: 3, name: "Nusrat Sultana", codeforces_handle: "nusrat_ac", current_rating: 1780, current_rank: "Expert" },
  { user_id: 4, rank: 4, name: "Rafiul Hasan", codeforces_handle: "rafi_codes", current_rating: 1650, current_rank: "Expert" },
  { user_id: 5, rank: 5, name: "Tanvir Islam", codeforces_handle: "tanvir_cf", current_rating: 1540, current_rank: "Specialist" }
];

const Codeforces = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState(null);

  const profileCache = useRef({});

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/cf/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setLeaderboard(result.data?.length ? result.data : DEFAULT_LEADERBOARD);
      } else {
        setLeaderboard(DEFAULT_LEADERBOARD);
      }
    } catch {
      setLeaderboard(DEFAULT_LEADERBOARD);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchProfile = async (userId) => {
    setSelectedUserId(userId);
    if (profileCache.current[userId]) {
      setProfileStats(profileCache.current[userId]);
      return;
    }
    setLoadingProfile(true);
    setProfileStats(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/cf/profile/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        profileCache.current[userId] = result.data;
        setProfileStats(result.data);
      } else {
        setError('Failed to fetch profile stats');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Standard Codeforces rank palette, tuned to stay readable on both themes
  const getRankColor = (rank) => {
    if (!rank) return 'inherit';
    const l = rank.toLowerCase();
    if (l.includes('newbie')) return 'var(--text-muted-more)';
    if (l.includes('pupil')) return 'var(--badge-green-text)';
    if (l.includes('specialist')) return '#03a89e';
    if (l.includes('candidate master')) return '#c026d3';
    if (l.includes('grandmaster')) return '#ef4444';
    if (l.includes('master')) return '#f59e0b';
    if (l.includes('expert')) return 'var(--badge-blue-text)';
    return 'inherit';
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

  const formatContestDate = (isoString) => {
    const d = parseApiDate(isoString);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Every contest since the user's first rated one, flagged attended or not.
  // Three states, not two: a contest they were never eligible for (a pupil
  // cannot enter Div. 1, or the round was unrated) must not be shown as missed.
  const renderContestAttendance = (attendance, summary) => {
    if (!attendance?.length || !summary) return null;

    const statusOf = (c) => {
      if (c.participated) return 'attended';
      return c.eligible ? 'missed' : 'ineligible';
    };

    return (
      <div className="contest-attendance-section">
        <h3>Contest Attendance</h3>

        <div className="attendance-summary">
          <span className="attendance-chip attended">
            {summary.participated} attended
          </span>
          <span className="attendance-chip missed">
            {summary.missed} missed
          </span>
          {summary.ineligible > 0 && (
            <span className="attendance-chip ineligible">
              {summary.ineligible} not eligible
            </span>
          )}
        </div>

        <div className="attendance-list">
          {attendance.map((c) => (
            <div key={c.contest_id} className={`attendance-item ${statusOf(c)}`}>
              <div className="attendance-main">
                <span className="attendance-name">{c.contest_name}</span>
                <span className="attendance-date">{formatContestDate(c.date)}</span>
              </div>
              <div className="attendance-meta">
                {c.participated ? (
                  <>
                    <span>Rank: {c.rank}</span>
                    <span className={c.rating_change >= 0 ? 'positive-change' : 'negative-change'}>
                      {c.rating_change > 0 ? '+' : ''}{c.rating_change}
                    </span>
                  </>
                ) : (
                  <span className="attendance-label">
                    {c.eligible ? 'Missed' : 'Not eligible'}
                  </span>
                )}
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
            <div className="skeleton-container">
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
            </div>
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
              <div className="skeleton-container">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-card"></div>
                <div className="skeleton skeleton-card"></div>
              </div>
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

                {renderContestAttendance(
                  profileStats.contest_attendance,
                  profileStats.attendance_summary
                )}
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
