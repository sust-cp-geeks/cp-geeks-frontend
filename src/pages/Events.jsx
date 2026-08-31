import { API_URL, toApiDate, parseApiDate } from '../api';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Events.css';

const DEFAULT_EVENTS = [
  {
    event_id: 1,
    title: "SUST IUPC 2026",
    description: "SUST IUPC 2026 Onsite Programming Contest & Fest"
  },
  {
    event_id: 2,
    title: "ICPC Regional",
    description: "ICPC Dhaka Regional Preliminary Contest 2026"
  },
  {
    event_id: 3,
    title: "Intra SUST",
    description: "SUST Intra University Junior Programming Contest"
  }
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const role = localStorage.getItem('role') || '';
  const token = localStorage.getItem('token') || '';
  const navigate = useNavigate();
  const showToast = useToast();

  // Create Event Form States
  const [showEventForm, setShowEventForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fetchEvents = useCallback((authToken = token) => {
    fetch(`${API_URL}/api/events`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setEvents(data.data);
        } else {
          setEvents(DEFAULT_EVENTS);
        }
      })
      .catch(() => {
        setEvents(DEFAULT_EVENTS);
      });
  }, [token]);

  useEffect(() => {
    fetchEvents(token);
  }, [fetchEvents, token]);

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const payload = { title, description };

    try {
      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setTitle(''); setDescription('');
        setShowEventForm(false);
        fetchEvents(token);
      } else {
        showToast(data.error || data.message || 'Failed to create event', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while creating the event.', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchEvents(token);
    } catch (err) {
      console.error(err);
    }
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
        <div className="create-form-modal" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
          <h3>Create New Event</h3>
          <form onSubmit={handleSaveEvent}>
            <div className="form-group">
              <label>Event Title (Required)</label>
              <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Enter event title" />
            </div>
            <div className="form-group">
              <label>Event Description</label>
              <textarea 
                className="form-textarea" rows="4" placeholder="Enter event details..."
                value={description} onChange={(e) => setDescription(e.target.value)} required
              />
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
            return (
              <div key={event.event_id} className="event-card-container">
                <div className="event-card">
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>{event.title}</h3>
                    <div className="event-description">
                      {event.description}
                    </div>
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
