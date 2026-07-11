import React, { useState } from 'react';

export default function LeaderboardTable({ result }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState({});

  if (!result) return null;

  const toggleExpandUser = (handle) => {
    setExpandedUser(prev => ({
      ...prev,
      [handle]: !prev[handle]
    }));
  };

  const getPodiumBadge = (rank) => {
    return <span className="regular-rank">#{rank}</span>;
  };

  const filteredRankings = result.rankings.filter(p =>
    p.handle.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="leaderboard-section">
      <div className="leaderboard-header-row">
        <h2>{result.title} Leaderboard</h2>
        <div className="search-box-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      <div className="table-responsive-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>VJudge Handle</th>
              <th className="text-center">Contests</th>
              <th className="text-center">Total Solved</th>
              <th className="text-center">Total Penalty</th>
              <th className="text-center">Total Upsolved</th>
              <th className="text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRankings.length > 0 ? (
              filteredRankings.map((row) => {
                const isExpanded = !!expandedUser[row.handle];
                return (
                  <React.Fragment key={row.handle}>
                    <tr
                      className={`leaderboard-row ${isExpanded ? 'expanded' : ''} ${row.rank <= 3 ? 'top-tier' : ''}`}
                      onClick={() => toggleExpandUser(row.handle)}
                    >
                      <td className="rank-col">
                        {getPodiumBadge(row.rank)}
                      </td>
                      <td className="name-col font-bold" style={{ color: row.real_name === 'unregistered' ? '#60a5fa' : 'var(--primary-color)' }}>
                        {row.real_name}
                      </td>
                      <td className="handle-col">
                        <span className="user-handle">{row.handle}</span>
                      </td>
                      <td className="participation-col text-center font-bold">
                        {row.contests_participated}
                      </td>
                      <td className="solved-col text-center font-bold">
                        {row.problems_solved}
                      </td>
                      <td className="penalty-col text-center font-mono">
                        {row.total_penalty}
                      </td>
                      <td className="upsolved-col text-center font-bold">
                        {row.total_upsolved || 0}
                      </td>
                      <td className="details-toggle-col text-center">
                        <button className="details-toggle-btn">
                          {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="details-subrow">
                        <td colSpan="8">
                          <div className="contest-breakdown-container">
                            <h4>Contest-wise Breakdown</h4>
                            <div className="breakdown-cards-grid">
                              {row.contest_details.map((detail, index) => (
                                <div key={index} className="breakdown-card">
                                  <div className="breakdown-contest-name">
                                    {detail.contest_name}
                                  </div>
                                  <div className="breakdown-stats-row">
                                    <div className="breakdown-stat">
                                      <span className="lbl">Solved</span>
                                      <span className="val font-bold">{detail.solved}</span>
                                    </div>
                                    <div className="breakdown-stat">
                                      <span className="lbl">Upsolved</span>
                                      <span className="val font-bold">{detail.upsolved || 0}</span>
                                    </div>
                                    <div className="breakdown-stat">
                                      <span className="lbl">Penalty</span>
                                      <span className="val font-mono">{detail.penalty}</span>
                                    </div>
                                    <div className="breakdown-stat" style={{ minWidth: '80px' }}>
                                      <span className="lbl">Participated</span>
                                      <span
                                        className="val font-bold"
                                        style={{
                                          color: detail.participated ? '#10b981' : '#f43f5e',
                                          background: detail.participated ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          fontSize: '0.75rem',
                                          display: 'inline-block',
                                          textAlign: 'center',
                                          marginTop: '2px',
                                          border: detail.participated ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)'
                                        }}
                                      >
                                        {detail.participated ? 'Yes' : 'No'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="empty-table-state">
                  {searchQuery ? 'No participants match your search query.' : 'No participant data available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
