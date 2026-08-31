import { API_URL, toApiDate, normalizeApiDate, parseApiDate } from '../api';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import EventStandings from '../components/EventStandings';
import './Events.css';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [event, setEvent] = useState(null);
  const [role] = useState(() => localStorage.getItem('role') || '');
  const [token] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'rank', 'contests', 'edit'
  const [activeTab, setActiveTab] = useState('rank');

  // Edit Event State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Add Contest State
  const [newContestId, setNewContestId] = useState('');

  // Merge Handles State
  const [mergeInputs, setMergeInputs] = useState([]);

  const fetchEvent = useCallback(async (authToken = token) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setEvent(data.data);
        setTitle(data.data.title || '');
        setDescription(data.data.description);
        if (data.data.merged_handles) {
          setMergeInputs(data.data.merged_handles);
        } else {
          setMergeInputs([]);
        }
      } else {
        showToast('Event not found', 'error');
        navigate('/events');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvent(token);
    }, 0);
    return () => clearTimeout(timer);
  }, [id, fetchEvent, token]);



  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      vjudge_contest_ids: event.vjudge_contest_ids, // keep same
      merged_handles: event.merged_handles // keep same
    };

    try {
      const res = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Event updated successfully', 'success');
        fetchEvent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddContest = async (e) => {
    e.preventDefault();
    let parsedId = null;
    const urlMatch = newContestId.match(/vjudge\.net\/contest\/(\d+)/);
    if (urlMatch) {
      parsedId = Number(urlMatch[1]);
    } else {
      const digitMatch = newContestId.match(/\d+/);
      if (digitMatch) {
        parsedId = Number(digitMatch[0]);
      }
    }
    
    if (!parsedId) {
      showToast('Could not extract a valid contest ID from the input.', 'error');
      return;
    }

    const existingIds = event.vjudge_contest_ids || [];
    if (existingIds.includes(parsedId)) {
      showToast('Already added', 'info'); return;
    }
    const updatedIds = [...existingIds, parsedId];
    
    await updateContestIds(updatedIds);
    setNewContestId('');
    setActiveTab('contests'); // auto-switch to see the added list
  };

  const handleRemoveContest = async (contestId) => {
    if(!window.confirm("Remove this contest?")) return;
    const existingIds = event.vjudge_contest_ids || [];
    const updatedIds = existingIds.filter(cid => cid !== contestId);
    await updateContestIds(updatedIds);
  };

  const updateContestIds = async (updatedIds) => {
    const payload = {
      title: event.title,
      description: event.description,
      vjudge_contest_ids: updatedIds.length > 0 ? updatedIds : null, // handle empty array properly
      merged_handles: event.merged_handles
    };
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) fetchEvent();
    } catch (err) {
      console.error(err);
    }
  };

  const updateMergedHandles = async (newMergedHandles) => {
    const payload = {
      title: event.title,
      description: event.description,
      vjudge_contest_ids: event.vjudge_contest_ids,
      merged_handles: newMergedHandles.length > 0 ? newMergedHandles : null
    };
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Merged handles updated', 'success');
        fetchEvent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="events-page"><div className="events-header"><h1>Loading...</h1></div></div>;
  if (!event) return null;

  const canEdit = role === 'admin' || role === 'manager';

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>{event.title}</h1>
        <Link to="/events" className="create-btn" style={{ textDecoration: 'none' }}>
          ← Back to Events
        </Link>
      </div>

      <div className="event-card-container">
        <div className="event-card" style={{ display: 'block' }}>
          <div className="event-description">
            {event.description}
          </div>
        </div>
      </div>

      <div className="event-tabs">
        <button
          className={`event-tab-btn ${activeTab === 'rank' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('rank')}
        >
          See Current Rank
        </button>
        {canEdit && (
          <button
            className={`event-tab-btn ${activeTab === 'contests' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('contests')}
          >
            Added Contests
          </button>
        )}
        {canEdit && (
          <button
            className={`event-tab-btn ${activeTab === 'edit' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Edit Event
          </button>
        )}
        {canEdit && (
          <button
            className={`event-tab-btn tab-success ${activeTab === 'add_contest' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('add_contest')}
          >
            + Add Contest
          </button>
        )}
        {canEdit && (
          <button
            className={`event-tab-btn ${activeTab === 'merge' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('merge')}
          >
            Merge Handles
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'rank' && (
          <div>
            {event.vjudge_contest_ids && event.vjudge_contest_ids.length > 0 ? (
              <EventStandings contestIds={event.vjudge_contest_ids} title={`${event.description} - TFC Standings`} mergedHandles={event.merged_handles} />
            ) : (
              <p className="tab-empty-text">No contests have been added to this event yet.</p>
            )}
          </div>
        )}

        {activeTab === 'contests' && canEdit && (
          <div>
            <h3 style={{ color: 'var(--primary-hover)', marginBottom: '15px' }}>Added VJudge Contests</h3>
            {event.vjudge_contest_ids && event.vjudge_contest_ids.length > 0 ? (
              <ul className="contest-id-list">
                {event.vjudge_contest_ids.map(cid => (
                  <li key={cid} className="contest-id-item">
                    <span style={{ fontSize: '1.1rem' }}>Contest ID: <strong style={{ color: 'var(--primary-hover)' }}>{cid}</strong></span>
                    {canEdit && (
                      <button onClick={() => handleRemoveContest(cid)} className="remove-contest-id-btn">
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tab-empty-text">No contests added.</p>
            )}

          </div>
        )}

        {activeTab === 'add_contest' && canEdit && (
          <div className="create-form-modal" style={{ margin: 0, border: 'none', padding: 0, boxShadow: 'none' }}>
            <h3 style={{ color: 'var(--badge-green-text)', marginBottom: '15px' }}>Add a New Contest</h3>
            <form onSubmit={handleAddContest} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ color: 'var(--text-muted)' }}>Enter VJudge Contest ID or URL:</label>
              <input 
                type="text" 
                value={newContestId} 
                onChange={(e) => setNewContestId(e.target.value)} 
                placeholder="e.g. 12345 or https://vjudge.net/contest/12345" 
                className="form-input" 
                style={{ width: '100%', maxWidth: '500px' }}
                required 
              />
              <button type="submit" className="save-btn" style={{ width: 'fit-content', padding: '12px 30px', marginTop: '10px' }}>
                Add Contest
              </button>
            </form>
          </div>
        )}

        {activeTab === 'merge' && canEdit && (
          <div className="create-form-modal" style={{ margin: 0, border: 'none', padding: 0, boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: 'var(--primary-hover)', margin: 0 }}>Merge Handles</h3>
              <button
                type="button"
                className="save-btn"
                style={{ padding: '8px 16px' }}
                onClick={() => {
                  const cleaned = mergeInputs
                    .map(m => {
                      const handles = [m.handles?.[0] || m.handle1 || '', m.handles?.[1] || m.handle2 || ''];
                      if (m.handles?.[2] || m.handle3) handles.push(m.handles?.[2] || m.handle3 || '');
                      return {
                        name: (m.name || '').trim(),
                        handles: handles.map(h => h.trim()).filter(Boolean)
                      };
                    })
                    .filter(m => m.name && m.handles.length >= 2);
                  updateMergedHandles(cleaned);
                }}
              >
                Save Merged Handles
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Combine multiple handles for participants who used different accounts across contests.</p>
            
            <div className="merge-inputs-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mergeInputs.map((mergeObj, index) => {
                const handle1 = mergeObj.handles?.[0] || mergeObj.handle1 || '';
                const handle2 = mergeObj.handles?.[1] || mergeObj.handle2 || '';
                const handle3 = mergeObj.handles?.[2] || mergeObj.handle3 || '';
                return (
                  <div key={index} className="merge-input-row-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', alignItems: 'center', background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Handle 1"
                        value={handle1}
                        style={{ margin: 0, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMergeInputs(prev => prev.map((m, i) => i === index ? { ...m, handle1: val, handles: [val, handle2, handle3].filter(Boolean) } : m));
                        }}
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Handle 2"
                        value={handle2}
                        style={{ margin: 0, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMergeInputs(prev => prev.map((m, i) => i === index ? { ...m, handle2: val, handles: [handle1, val, handle3].filter(Boolean) } : m));
                        }}
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Handle 3 (Optional)"
                        value={handle3}
                        style={{ margin: 0, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMergeInputs(prev => prev.map((m, i) => i === index ? { ...m, handle3: val, handles: [handle1, handle2, val].filter(Boolean) } : m));
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Merged Name"
                        value={mergeObj.name || ''}
                        style={{ margin: 0, padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMergeInputs(prev => prev.map((m, i) => i === index ? { ...m, name: val } : m));
                        }}
                        required
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        className="remove-contest-btn"
                        style={{ padding: '0.6rem 0.8rem', width: '100%' }}
                        onClick={() => {
                          setMergeInputs(mergeInputs.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="add-merge-btn"
              onClick={() => setMergeInputs([...mergeInputs, { handles: [], name: '' }])}
              style={{
                background: 'var(--badge-green-bg)',
                color: 'var(--badge-green-text)',
                border: '1px dashed var(--badge-green-border)',
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
              + Add Merge Rule
            </button>
          </div>
        )}

        {activeTab === 'edit' && canEdit && (
          <div className="create-form-modal" style={{ margin: 0, border: 'none', padding: 0, boxShadow: 'none' }}>
            <h3 style={{ color: 'var(--primary-hover)', marginBottom: '15px' }}>Edit Event Details</h3>
            <form onSubmit={handleUpdateEvent}>
              <div className="form-group">
                <label>Event Title</label>
                <input 
                  type="text"
                  className="form-input" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Event Description</label>
                <textarea 
                  className="form-textarea" 
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn" style={{ width: 'auto', padding: '12px 30px' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
