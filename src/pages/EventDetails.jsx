import { API_URL } from '../api';
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
  const [role, setRole] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'rank', 'contests', 'edit'
  const [activeTab, setActiveTab] = useState('rank');

  // Edit Event State
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Add Contest State
  const [newContestId, setNewContestId] = useState('');

  const fetchEvent = useCallback(async (authToken = token) => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setEvent(data.data);
        setDescription(data.data.description);
        if (data.data.event_date) {
          const [d, t] = data.data.event_date.split('T');
          setDate(d || '');
          setTime(t ? t.substring(0, 5) : '');
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
    setRole(localStorage.getItem('role') || '');
    const currentToken = localStorage.getItem('token') || '';
    setToken(currentToken);
    fetchEvent(currentToken);
  }, [id, fetchEvent]);



  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    const timeStr = time ? `${time}:00` : '00:00:00';
    const event_date = `${date}T${timeStr}`;

    const payload = {
      description,
      event_date,
      vjudge_contest_ids: event.vjudge_contest_ids // keep same
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
      description: event.description,
      event_date: event.event_date,
      vjudge_contest_ids: updatedIds.length > 0 ? updatedIds : null // handle empty array properly
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

  if (loading) return <div className="events-page"><div className="events-header"><h1>Loading...</h1></div></div>;
  if (!event) return null;

  const canEdit = role === 'admin' || role === 'manager';

  const dateData = (() => {
    const d = new Date(event.event_date);
    if(isNaN(d)) return null;
    return {
      day: d.getDate(),
      monthYear: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      timeStr: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
  })();

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Event Details</h1>
        <Link to="/events" className="create-btn" style={{ textDecoration: 'none' }}>
          ← Back to Events
        </Link>
      </div>

      <div className="event-card-container">
        <div className="event-card">
          <div className="event-description">
            {event.description}
          </div>
          <div className="event-actions">
            <div className={`event-date-box ${!dateData ? 'no-date' : ''}`}>
              {dateData && (
                <>
                  <div className="date-day">{dateData.day}</div>
                  <div className="date-month-year">{dateData.monthYear}</div>
                  <div className="date-time">{dateData.timeStr}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="event-tabs" style={{ display: 'flex', gap: '10px', margin: '20px 0', flexWrap: 'wrap' }}>
        <button 
          className={`action-btn ${activeTab === 'rank' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('rank')}
          style={{ padding: '10px 20px', background: activeTab === 'rank' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(30,41,59,0.4)', color: '#60a5fa', border: activeTab === 'rank' ? '1px solid #60a5fa' : '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          See Current Rank
        </button>
        {canEdit && (
          <button 
            className={`action-btn ${activeTab === 'contests' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('contests')}
            style={{ padding: '10px 20px', background: activeTab === 'contests' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(30,41,59,0.4)', color: '#60a5fa', border: activeTab === 'contests' ? '1px solid #60a5fa' : '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Added Contests
          </button>
        )}
        {canEdit && (
          <button 
            className={`action-btn ${activeTab === 'edit' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('edit')}
            style={{ padding: '10px 20px', background: activeTab === 'edit' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(30,41,59,0.4)', color: '#60a5fa', border: activeTab === 'edit' ? '1px solid #60a5fa' : '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Edit Event
          </button>
        )}
        {canEdit && (
          <button 
            className={`action-btn ${activeTab === 'add_contest' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('add_contest')}
            style={{ padding: '10px 20px', background: activeTab === 'add_contest' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30,41,59,0.4)', color: '#10b981', border: activeTab === 'add_contest' ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Add Contest
          </button>
        )}
      </div>

      <div className="tab-content" style={{ padding: '20px', background: 'rgba(30,41,59,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        {activeTab === 'rank' && (
          <div>
            {event.vjudge_contest_ids && event.vjudge_contest_ids.length > 0 ? (
              <EventStandings contestIds={event.vjudge_contest_ids} title={`${event.description} - TFC Standings`} />
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '2rem' }}>No contests have been added to this event yet.</p>
            )}
          </div>
        )}

        {activeTab === 'contests' && canEdit && (
          <div>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>Added VJudge Contests</h3>
            {event.vjudge_contest_ids && event.vjudge_contest_ids.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '15px' }}>
                {event.vjudge_contest_ids.map(cid => (
                  <li key={cid} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px 20px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '1.1rem' }}>Contest ID: <strong style={{ color: 'var(--primary-color)' }}>{cid}</strong></span>
                    {canEdit && (
                      <button onClick={() => handleRemoveContest(cid)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>No contests added.</p>
            )}

          </div>
        )}

        {activeTab === 'add_contest' && canEdit && (
          <div className="create-form-modal" style={{ margin: 0, border: 'none', padding: 0 }}>
            <h3 style={{ color: '#10b981', marginBottom: '15px' }}>Add a New Contest</h3>
            <form onSubmit={handleAddContest} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ color: '#cbd5e1' }}>Enter VJudge Contest ID or URL:</label>
              <input 
                type="text" 
                value={newContestId} 
                onChange={(e) => setNewContestId(e.target.value)} 
                placeholder="e.g. 12345 or https://vjudge.net/contest/12345" 
                className="form-input" 
                style={{ width: '100%', maxWidth: '500px' }}
                required 
              />
              <button type="submit" className="save-btn" style={{ background: '#10b981', color: 'white', width: 'fit-content', padding: '12px 30px', marginTop: '10px' }}>
                Add Contest
              </button>
            </form>
          </div>
        )}

        {activeTab === 'edit' && canEdit && (
          <div className="create-form-modal" style={{ margin: 0, border: 'none', padding: 0 }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>Edit Event Details</h3>
            <form onSubmit={handleUpdateEvent}>
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
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Date (Required)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Time (Optional)</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
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
