import { API_URL, parseApiDate } from '../api';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
// Deliberately reuses the Codeforces stylesheet: the two pages show the same
// shapes and should look identical. Only the labels and bands differ.
import { rankClassFor } from '../utils/rank';
import './Codeforces.css';
import '../components/Skeleton.css';

const Atcoder = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get('user');
  const [profileStats, setProfileStats] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [error, setError] = useState(null);
  const [attendanceFilter, setAttendanceFilter] = useState('all');

  const profileCache = useRef({});
  const profileRef = useRef(null);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/atcoder/leaderboard`, { headers: authHeaders() });
        if (res.ok) {
          const result = await res.json();
          setLeaderboard(result.data || []);
        } else {
          setError('Could not load the AtCoder leaderboard');
        }
      } catch {
        setError('Could not connect to the server');
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    load();
  }, []);

  const fetchProfile = async (userId) => {
    setAttendanceFilter('all');
    setProfileError(null);
    if (profileCache.current[userId]) {
      setProfileStats(profileCache.current[userId]);
      return;
    }
    setLoadingProfile(true);
    setProfileStats(null);
    try {
      const res = await fetch(`${API_URL}/api/atcoder/profile/${userId}`, { headers: authHeaders() });
      if (res.ok) {
        const result = await res.json();
        profileCache.current[userId] = result.data;
        setProfileStats(result.data);
      } else if (res.status === 404) {
        // Normal empty state: no handle set, or the first sync has not run yet.
        setProfileError('No AtCoder data yet. Add a handle on your profile — it appears after the next sync.');
      } else {
        setProfileError('Could not load AtCoder stats');
      }
    } catch {
      setProfileError('Could not connect to the server');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) fetchProfile(selectedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedUserId && (profileStats || profileError) && profileRef.current) {
      profileRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedUserId, profileStats, profileError]);

  const formatContestDate = (isoString) => {
    const d = parseApiDate(isoString);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatSynced = (isoString) => {
    const d = parseApiDate(isoString);
    if (!d) return null;
    return d.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  };

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
          {Object.entries(periodData.buckets)
            .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
            .map(([bucket, count]) => (
              <div key={bucket} className="solve-bar-wrapper">
                <span className="bucket-label">{bucket}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${maxVal > 0 ? (count / maxVal) * 100 : 0}%` }}>
                    <span className="bar-count">{count > 0 ? count : ''}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

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
                    <span>Rank: {c.place}</span>
                    {c.rating_change !== null && (
                      <span className={c.rating_change >= 0 ? 'positive-change' : 'negative-change'}>
                        {c.rating_change > 0 ? '+' : ''}{c.rating_change}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="attendance-label">
                    {c.eligible ? 'Missed' : 'Not eligible'}
                  </span>
                )}
              </div>
            </div>
          ))}
          {shown.length === 0 && <p className="attendance-empty">Nothing in this group.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="cf-page-wrapper">
      <div className="cf-header">
        <h1>AtCoder Dashboard</h1>
        <p>Community leaderboard and individual contest statistics</p>
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
                      <td>{user.rank ? `#${user.rank}` : '—'}</td>
                      <td>{user.name}</td>
                      <td className={rankClassFor('atcoder', user.current_rating, user.current_rank)}>
                        {user.atcoder_handle}
                      </td>
                      <td>{user.current_rating ?? 'Unrated'}</td>
                      <td>
                        <Link className="view-btn" to={`/atcoder?user=${user.user_id}`}>
                          View Stats
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No members have added an AtCoder handle yet.
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
              </div>
            ) : profileError ? (
              <div className="cf-error">{profileError}</div>
            ) : profileStats ? (
              <div className="profile-stats-card">
                <div className="profile-stats-header">
                  <h2 className={rankClassFor('atcoder', profileStats.current_rating, profileStats.current_rank)}>
                    {profileStats.atcoder_handle}
                  </h2>
                  <div className="rank-badges">
                    <span className="badge current-badge">
                      Rating:{' '}
                      <strong className={rankClassFor('atcoder', profileStats.current_rating, profileStats.current_rank)}>
                        {profileStats.current_rating ?? 'Unrated'} ({profileStats.current_rank || 'N/A'})
                      </strong>
                    </span>
                    <span className="badge max-badge">
                      Max:{' '}
                      <strong className={rankClassFor('atcoder', profileStats.max_rating, profileStats.max_rank)}>
                        {profileStats.max_rating ?? 'Unrated'} ({profileStats.max_rank || 'N/A'})
                      </strong>
                    </span>
                  </div>
                </div>

                {/* This data is refreshed on a schedule rather than fetched live,
                    so say how old it is instead of implying it is current. */}
                {profileStats.synced_at && (
                  <p className="attendance-date" style={{ marginBottom: '1rem' }}>
                    Updated {formatSynced(profileStats.synced_at)} · {profileStats.solved_count ?? 0} problems solved all-time
                  </p>
                )}
                {profileStats.sync_error && (
                  <div className="cf-error">
                    Last refresh failed for this handle — it may be misspelled.
                  </div>
                )}

                {profileStats.solve_counts && (
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
                )}

                <div className="recent-contests-section">
                  <h3>Recent Contests</h3>
                  {profileStats.recent_contests?.length > 0 ? (
                    <div className="contests-list">
                      {profileStats.recent_contests.map((c) => (
                        <div key={c.contest_id} className="contest-item">
                          <div className="contest-name">{c.contest_name}</div>
                          <div className="contest-details">
                            <span>Rank: {c.place}</span>
                            <span className={c.new_rating - c.old_rating >= 0 ? 'positive-change' : 'negative-change'}>
                              {c.new_rating - c.old_rating > 0 ? '+' : ''}{c.new_rating - c.old_rating}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No contests yet.</p>
                  )}
                </div>

                {renderContestAttendance(
                  profileStats.contest_attendance,
                  profileStats.attendance_summary
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default Atcoder;
