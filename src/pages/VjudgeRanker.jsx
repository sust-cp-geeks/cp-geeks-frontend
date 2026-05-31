import React, { useState, useEffect } from 'react';
import './VjudgeRanker.css';

export default function VjudgeRanker() {
  const [title, setTitle] = useState('VJudge Standings');
  const [contestIdsRaw, setContestIdsRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState({});

  // Reset error when inputs change
  useEffect(() => {
    setError('');
  }, [title, contestIdsRaw]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setSessionId('');

    // Parse IDs: split by spaces, commas, or newlines
    const idStrings = contestIdsRaw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    
    if (idStrings.length === 0) {
      setError('Please enter at least one VJudge contest ID.');
      return;
    }

    const contest_ids = [];
    for (const str of idStrings) {
      const num = Number(str);
      if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        setError(`"${str}" is not a valid contest ID. IDs must be positive integers.`);
        return;
      }
      contest_ids.push(num);
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8080/api/ranker/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim() || 'VJudge Standings',
          contest_ids,
          problem_weights: null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
        setSessionId(data.session_id);
      } else {
        setError(data.message || 'An error occurred while fetching rankings.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend server. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!sessionId) return;
    window.open(`http://localhost:8080/api/ranker/pdf/${sessionId}`, '_blank');
  };

  const toggleExpandUser = (handle) => {
    setExpandedUser(prev => ({
      ...prev,
      [handle]: !prev[handle]
    }));
  };

  // Filter rankings by search query
  const filteredRankings = result?.rankings.filter(p => 
    p.handle.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getPodiumBadge = (rank) => {
    if (rank === 1) return <span className="podium-badge gold">🥇 Rank 1</span>;
    if (rank === 2) return <span className="podium-badge silver">🥈 Rank 2</span>;
    if (rank === 3) return <span className="podium-badge bronze">🥉 Rank 3</span>;
    return <span className="regular-rank">#{rank}</span>;
  };

  return (
    <div className="vjudge-ranker-page">
      <div className="ranker-header">
        <h1>VJudge Contest Sorter</h1>
        <p className="subtitle">
          Combine and sort results from multiple VJudge contests based on solved problems and penalty.
        </p>
      </div>

      <div className="ranker-grid">
        <div className="ranker-form-card">
          <h2>Configure Standings</h2>
          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label htmlFor="title-input">Standings Title</label>
              <input
                id="title-input"
                type="text"
                className="form-input"
                placeholder="e.g. TFC Season 1 Final Leaderboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contests-input">VJudge Contest ID(s)</label>
              <textarea
                id="contests-input"
                className="form-textarea"
                rows="4"
                placeholder="Enter one or multiple IDs (comma, space, or newline separated)&#10;e.g. 811682, 811683"
                value={contestIdsRaw}
                onChange={(e) => setContestIdsRaw(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-alert">{error}</div>}

            <button type="submit" className="analyze-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span> Analyzing Contests...
                </>
              ) : (
                'Analyze & Rank'
              )}
            </button>
          </form>
        </div>

        {result && (
          <div className="ranker-results-summary">
            <h2>Analysis Summary</h2>
            <div className="summary-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Contests</span>
                <span className="stat-val">{result.total_contests}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Participants</span>
                <span className="stat-val">{result.total_participants}</span>
              </div>
            </div>
            
            <div className="action-buttons-row">
              {sessionId && (
                <button className="download-pdf-btn" onClick={handleDownloadPdf}>
                  <svg className="pdf-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12,11.5A1.5,1.5 0 0,1 10.5,10A1.5,1.5 0 0,1 12,8.5A1.5,1.5 0 0,1 13.5,10A1.5,1.5 0 0,1 12,11.5M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,17H5V7H19V17M12,6A4,4 0 0,0 8,10A4,4 0 0,0 12,14A4,4 0 0,0 16,10A4,4 0 0,0 12,6Z" />
                  </svg>
                  Download Leaderboard PDF
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {result && (
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
                  <th>VJudge Handle</th>
                  <th className="text-center">Total Solved</th>
                  <th className="text-center">Total Penalty</th>
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
                          <td className="handle-col">
                            <span className="user-handle">{row.handle}</span>
                          </td>
                          <td className="solved-col text-center font-bold">
                            {row.problems_solved}
                          </td>
                          <td className="penalty-col text-center font-mono">
                            {row.total_penalty}
                          </td>
                          <td className="details-toggle-col text-center">
                            <button className="details-toggle-btn">
                              {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="details-subrow">
                            <td colSpan="5">
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
                                          <span className="lbl">Penalty</span>
                                          <span className="val font-mono">{detail.penalty}</span>
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
                    <td colSpan="5" className="empty-table-state">
                      {searchQuery ? 'No participants match your search query.' : 'No participant data available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
