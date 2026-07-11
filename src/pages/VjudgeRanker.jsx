import { API_URL } from '../api';
import React, { useState, useEffect } from 'react';
import './VjudgeRanker.css';
import LeaderboardTable from '../components/LeaderboardTable';

export default function VjudgeRanker() {
  const [title, setTitle] = useState('VJudge Standings');
  const [contestInputs, setContestInputs] = useState([{ value: '', title: '', loading: false }]);
  const [mergeInputs, setMergeInputs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState('');

  // Reset error when inputs change
  useEffect(() => {
    setError('');
  }, [title, contestInputs, mergeInputs]);

  const handleInputBlur = async (index) => {
    const input = contestInputs[index].value.trim();
    if (!input) return;

    // Extract numeric ID from URL (e.g. https://vjudge.net/contest/815719)
    const urlMatch = input.match(/\/contest\/(\d+)/);
    let idStr = urlMatch ? urlMatch[1] : input;

    const num = Number(idStr);
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      return; // invalid ID, don't fetch
    }

    if (contestInputs[index].loading) return;

    const newInputs = [...contestInputs];
    newInputs[index].loading = true;
    setContestInputs(newInputs);

    try {
      const response = await fetch(`${API_URL}/api/ranker/contest-title/${num}`);
      const data = await response.json();
      if (response.ok && data.success) {
        const updatedInputs = [...contestInputs];
        updatedInputs[index] = {
          ...updatedInputs[index],
          title: data.title || '',
          loading: false
        };
        setContestInputs(updatedInputs);
      } else {
        const updatedInputs = [...contestInputs];
        updatedInputs[index].loading = false;
        setContestInputs(updatedInputs);
      }
    } catch (err) {
      console.error(err);
      const updatedInputs = [...contestInputs];
      updatedInputs[index].loading = false;
      setContestInputs(updatedInputs);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setSessionId('');

    const contest_ids = [];
    const custom_titles = [];
    for (let i = 0; i < contestInputs.length; i++) {
      const input = contestInputs[i].value.trim();
      if (!input) continue;

      // Extract numeric ID from URL (e.g. https://vjudge.net/contest/815719)
      const urlMatch = input.match(/\/contest\/(\d+)/);
      let idStr = urlMatch ? urlMatch[1] : input;

      const num = Number(idStr);
      if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        setError(`"${input}" is not a valid contest ID or URL. IDs must be positive integers.`);
        return;
      }
      contest_ids.push(num);
      custom_titles.push(contestInputs[i].title.trim());
    }
    
    if (contest_ids.length === 0) {
      setError('Please enter at least one VJudge contest ID or URL.');
      return;
    }

    const merged_handles = mergeInputs
      .map(m => {
        const handles = [m.handle1.trim(), m.handle2.trim()];
        if (m.handle3 && m.handle3.trim()) {
          handles.push(m.handle3.trim());
        }
        return {
          name: m.name.trim(),
          handles: handles.filter(Boolean)
        };
      })
      .filter(m => m.name && m.handles.length >= 2);

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/ranker/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim() || 'VJudge Standings',
          contest_ids,
          problem_weights: null,
          custom_titles: custom_titles.length > 0 ? custom_titles : null,
          merged_handles: merged_handles.length > 0 ? merged_handles : null
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

  const handleDownloadPdf = (includeDetails) => {
    if (!sessionId) return;
    window.open(`${API_URL}/api/ranker/pdf/${sessionId}?include_details=${includeDetails}`, '_blank');
  };



  return (
    <div className="vjudge-ranker-page">
      <div className="ranker-header">
        <h1>Mesh your Vjudge Contests</h1>
        <p className="subtitle">
          Combine and sort results from multiple VJudge contests based on solved problems and penalty.
        </p>
      </div>

      <div className={`ranker-grid ${!result ? 'centered' : ''}`}>
        <div className="ranker-form-card">
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
              <label>Add your selected contests URLs/Contest IDs</label>
              <div className="contest-inputs-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {contestInputs.map((inputObj, index) => (
                  <div key={index} className="contest-input-row-card">
                    {/* Column 1: Serial Number */}
                    <div style={{
                      fontWeight: '700',
                      color: 'var(--primary-color)',
                      fontSize: '1rem',
                      minWidth: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '50%',
                    }}>
                      {index + 1}
                    </div>

                    {/* Column 2: Input Field for Contest URL/ID */}
                    <div style={{ width: '100%' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contest ID or URL"
                        value={inputObj.value}
                        style={{ margin: 0, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                        onChange={(e) => {
                          const newInputs = [...contestInputs];
                          newInputs[index].value = e.target.value;
                          setContestInputs(newInputs);
                        }}
                        onBlur={() => handleInputBlur(index)}
                        required
                      />
                    </div>

                    {/* Column 3: Modifiable Contest Title */}
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={inputObj.loading ? "Fetching title..." : "Custom Contest Title (Optional)"}
                        value={inputObj.title}
                        disabled={inputObj.loading}
                        style={{
                          margin: 0,
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.9rem',
                          borderColor: inputObj.title ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'
                        }}
                        onChange={(e) => {
                          const newInputs = [...contestInputs];
                          newInputs[index].title = e.target.value;
                          setContestInputs(newInputs);
                        }}
                      />
                      {inputObj.loading && (
                        <div style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}>
                          <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                        </div>
                      )}
                    </div>

                    {/* Column 4: Delete Button */}
                    <div>
                      {contestInputs.length > 1 ? (
                        <button
                          type="button"
                          className="remove-contest-btn"
                          onClick={() => {
                            setContestInputs(contestInputs.filter((_, i) => i !== index));
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            padding: '0.6rem 0.8rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                        >
                          Delete
                        </button>
                      ) : (
                        <div style={{ width: '60px' }}></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="add-contest-btn"
                onClick={() => setContestInputs([...contestInputs, { value: '', title: '', loading: false }])}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  border: '1px dashed #3b82f6',
                  borderRadius: '6px',
                  padding: '0.6rem 1rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginTop: '15px',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'background 0.2s'
                }}
              >
                + Add new contest
              </button>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Merge Handles (Optional)</label>
              <div className="merge-inputs-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mergeInputs.map((mergeObj, index) => (
                  <div key={index} className="merge-input-row-card">
                    {/* Handle 1 */}
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Handle 1"
                        value={mergeObj.handle1}
                        style={{ margin: 0, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                        onChange={(e) => {
                          const newMerges = [...mergeInputs];
                          newMerges[index].handle1 = e.target.value;
                          setMergeInputs(newMerges);
                        }}
                        required
                      />
                    </div>
                    {/* Handle 2 */}
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Handle 2"
                        value={mergeObj.handle2}
                        style={{ margin: 0, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                        onChange={(e) => {
                          const newMerges = [...mergeInputs];
                          newMerges[index].handle2 = e.target.value;
                          setMergeInputs(newMerges);
                        }}
                        required
                      />
                    </div>
                    {/* Handle 3 */}
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Handle 3 (Optional)"
                        value={mergeObj.handle3}
                        style={{ margin: 0, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                        onChange={(e) => {
                          const newMerges = [...mergeInputs];
                          newMerges[index].handle3 = e.target.value;
                          setMergeInputs(newMerges);
                        }}
                      />
                    </div>
                    {/* Merge Name */}
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Merge Name"
                        value={mergeObj.name}
                        style={{ margin: 0, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                        onChange={(e) => {
                          const newMerges = [...mergeInputs];
                          newMerges[index].name = e.target.value;
                          setMergeInputs(newMerges);
                        }}
                        required
                      />
                    </div>
                    {/* Delete Button */}
                    <div>
                      <button
                        type="button"
                        className="remove-contest-btn"
                        onClick={() => {
                          setMergeInputs(mergeInputs.filter((_, i) => i !== index));
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.8rem',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ef4444';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="add-merge-btn"
                onClick={() => setMergeInputs([...mergeInputs, { handle1: '', handle2: '', handle3: '', name: '' }])}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#34d399',
                  border: '1px dashed #10b981',
                  borderRadius: '6px',
                  padding: '0.6rem 1rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginTop: '15px',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'background 0.2s'
                }}
              >
                + Merge handles
              </button>
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
                <span className="stat-label">Unique Participants</span>
                <span className="stat-val">{result.total_participants}</span>
              </div>
            </div>
            
            <div className="action-buttons-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sessionId && (
                <>
                  <button className="download-pdf-btn" onClick={() => handleDownloadPdf(true)}>
                    <svg className="pdf-icon" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M12,11.5A1.5,1.5 0 0,1 10.5,10A1.5,1.5 0 0,1 12,8.5A1.5,1.5 0 0,1 13.5,10A1.5,1.5 0 0,1 12,11.5M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,17H5V7H19V17M12,6A4,4 0 0,0 8,10A4,4 0 0,0 12,14A4,4 0 0,0 16,10A4,4 0 0,0 12,6Z" />
                    </svg>
                    Download PDF (With Details)
                  </button>
                  <button className="download-pdf-no-details-btn" onClick={() => handleDownloadPdf(false)}>
                    <svg className="pdf-icon" viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M12,11.5A1.5,1.5 0 0,1 10.5,10A1.5,1.5 0 0,1 12,8.5A1.5,1.5 0 0,1 13.5,10A1.5,1.5 0 0,1 12,11.5M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,17H5V7H19V17M12,6A4,4 0 0,0 8,10A4,4 0 0,0 12,14A4,4 0 0,0 16,10A4,4 0 0,0 12,6Z" />
                    </svg>
                    Download PDF (No Details)
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {result && (
        <LeaderboardTable result={result} sessionId={sessionId} />
      )}
    </div>
  );
}
