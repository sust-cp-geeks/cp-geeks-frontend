import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Events.css';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [role, setRole] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  // Create Event Form States
  const [showEventForm, setShowEventForm] = useState(false);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    setRole(localStorage.getItem('role') || '');
    const currentToken = localStorage.getItem('token') || '';
    setToken(currentToken);
    fetchEvents(currentToken);
  }, []);

  const fetchEvents = (authToken = token) => {
    fetch('http://localhost:8080/api/events', {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEvents(data.data);
        }
      })
      .catch(err => console.error("Failed to fetch events:", err));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!description.trim() || !date) return;

    const timeStr = time ? `${time}:00` : '00:00:00';
    const event_date = `${date}T${timeStr}`;

    const payload = { description, event_date };

    try {
      const res = await fetch('http://localhost:8080/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setDescription(''); setDate(''); setTime('');
        setShowEventForm(false);
        fetchEvents(token);
      } else {
        alert(data.message || 'Failed to create event');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while creating the event.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchEvents(token);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateBox = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    
    const day = d.getDate();
    const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    let timeStr = null;
    if (d.getHours() !== 0 || d.getMinutes() !== 0) {
      timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return { day, monthYear, timeStr };
  };

  const canEdit = role === 'admin' || role === 'manager';

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Events</h1>
        {canEdit && !showEventForm && (
          <button className="create-btn" onClick={() => setShowEventForm(true)}>
            + Create an event
          </button>
        )}
      </div>

      {showEventForm && (
        <div className="create-form-modal" style={{ marginBottom: '1rem', marginTop: '1rem', border: '2px solid #3C3489' }}>
          <h3>Create New Event</h3>
          <form onSubmit={handleSaveEvent}>
            <div className="form-group">
              <label>Event Description</label>
              <textarea 
                className="form-textarea" rows="4" placeholder="Enter event details..."
                value={description} onChange={(e) => setDescription(e.target.value)} required
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Date (Required)</label>
                <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Time (Optional)</label>
                <input type="time" className="form-input" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowEventForm(false)}>Cancel</button>
              <button type="submit" className="save-btn">Create Event</button>
            </div>
          </form>
        </div>
      )}

      <div className="events-list">
        {events.length > 0 ? (
          events.map((event) => {
            const dateData = formatDateBox(event.event_date);
            return (
              <div key={event.event_id} className="event-card-container">
                <div className="event-card">
                  <div className="event-description">
                    {event.description}
                  </div>
                  
                  <div className="event-actions">
                    <div className="admin-actions">
                      <button className="action-btn edit-team-btn" onClick={() => navigate(`/events/${event.event_id}`)} style={{ fontWeight: 'bold' }}>
                        View Details
                      </button>
                      {canEdit && (
                        <button className="action-btn delete-btn" onClick={() => handleDeleteEvent(event.event_id)}>
                          Delete
                        </button>
                      )}
                    </div>
                    <div className={`event-date-box ${!dateData ? 'no-date' : ''}`}>
                      {dateData ? (
                        <>
                          <div className="date-day">{dateData.day}</div>
                          <div className="date-month-year">{dateData.monthYear}</div>
                          {dateData.timeStr && <div className="date-time">{dateData.timeStr}</div>}
                        </>
                      ) : (
                        <span></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">No events available at the moment.</div>
        )}
      </div>
    </div>
  );
}
