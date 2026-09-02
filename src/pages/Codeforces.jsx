import { API_URL, parseApiDate } from '../api';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SubmissionHeatmap from '../components/SubmissionHeatmap';
import { rankClassFor } from '../utils/rank';
import './Codeforces.css';

import '../components/Skeleton.css';

const Codeforces = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get('user');
  const [profileStats, setProfileStats] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState(null);
  const [attendanceFilter, setAttendanceFilter] = useState('all');

  const profileCache = useRef({});
  const profileRef = useRef(null);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/cf/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setLeaderboard(result.data || []);
        setLeaderboardError(null);
      } else {
        // this endpoint asks codeforces for every rating as the page loads, so
        // a codeforces outage lands here. say so — an empty table reads as
        // "nobody has joined", which is a different and wrong story
        setLeaderboard([]);
        setLeaderboardError('Could not load ratings from Codeforces. It may be down — try again shortly.');
      }
    } catch {
      setLeaderboard([]);
      setLeaderboardError('Could not reach the server. Check your connection and try again.');
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
    setAttendanceFilter('all');
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

  // The open profile is held in the url so a stats view can be opened in its
  // own tab and two members compared side by side.
  useEffect(() => {
    if (selectedUserId) fetchProfile(selectedUserId);
  }, [selectedUserId]);

  // Clicking a row from halfway down the leaderboard would otherwise drop the
  // profile in above the viewport, so bring it into view once it has loaded.
  useEffect(() => {
    if (selectedUserId && profileStats && profileRef.current) {
      profileRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedUserId, profileStats]);

  const renderSolveCountBars = (periodData) => {
    if (!periodData) return null;
    // an empty window used to render seven blank tracks, which reads as a
    // broken chart rather than a quiet month
    if (!periodData.total) {
      return (
        <div className="solve-bars-container">
          <h4>Total Solves: 0</h4>
          <p className="solve-bars-empty">No solves in this period</p>
        </div>
      );
    }
    const maxVal = Math.max(...Object.values(periodData.buckets));

    return (
      <div className="solve-bars-container">
        <h4>Total Solves: {periodData.total}</h4>
        <div className="solve-bars">
          {/* The API sends these as an object, and its keys sort as strings —
              "500-999" lands after "3000+". Order by the lower bound instead of
              trusting key order, which JSON does not guarantee anyway. */}
          {Object.entries(periodData.buckets)
            .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
            .map(([bucket, count]) => (
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

    const chips = [
      { key: 'all', label: `All ${summary.total_contests}` },
      { key: 'attended', label: `${summary.participated} attended` },
      { key: 'missed', label: `${summary.missed} missed` },
      ...(summary.ineligible > 0
        ? [{ key: 'ineligible', label: `${summary.ineligible} not eligible` }]
        : [])
    ];

    const shown = attendanceFilter === 'all'
      ? attendance
      : attendance.filter((c) => statusOf(c) === attendanceFilter);

    return (
      <div className="contest-attendance-section">
        <h3>Contest Attendance</h3>

        <div className="attendance-summary">
          {chips.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`attendance-chip ${key} ${attendanceFilter === key ? 'is-active' : ''}`}
              aria-pressed={attendanceFilter === key}
              onClick={() => setAttendanceFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="attendance-list">
          {shown.map((c) => (
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
          {shown.length === 0 && (
            <p className="attendance-empty">No contests in this category.</p>
          )}
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
                      <td className={rankClassFor('codeforces', user.current_rating, user.current_rank)}>
                        {user.codeforces_handle}
                      </td>
                      <td>{user.current_rating || 'Unrated'}</td>
                      <td>

                        <Link
                          className="view-btn"
                          to={`/codeforces?user=${user.user_id}`}
                        >
                          View Stats
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">
                        {leaderboardError || 'No members have linked a Codeforces handle yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedUserId && (
          <div className="cf-profile-section" ref={profileRef}>
            <button className="close-profile-btn" onClick={() => setSearchParams({})}>
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
                  <h2 className={rankClassFor('codeforces', profileStats.current_rating, profileStats.current_rank)}>
                    {profileStats.codeforces_handle}
                  </h2>
                  <div className="rank-badges">
                    <span className="badge current-badge">
                      Rating:{' '}
                      <strong className={rankClassFor('codeforces', profileStats.current_rating, profileStats.current_rank)}>
                        {profileStats.current_rating || 'Unrated'} ({profileStats.current_rank || 'N/A'})
                      </strong>
                    </span>
                    <span className="badge max-badge">
                      Max:{' '}
                      <strong className={rankClassFor('codeforces', profileStats.max_rating, profileStats.max_rank)}>
                        {profileStats.max_rating || 'Unrated'} ({profileStats.max_rank || 'N/A'})
                      </strong>
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

                <SubmissionHeatmap handle={profileStats.codeforces_handle} />

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
