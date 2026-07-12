import { API_URL } from '../api';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ToastContext';
import './Announcements.css';

const formatDateBox = (isoString) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  
  const day = d.getDate();
  const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // e.g., Apr 2026
  
  let timeStr = null;
  if (d.getHours() !== 0 || d.getMinutes() !== 0) {
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minsStr = minutes.toString().padStart(2, '0');
    timeStr = `${hours}:${minsStr} ${ampm}`;
  }

  return { day, monthYear, timeStr };
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const role = localStorage.getItem('role') || '';
  const token = localStorage.getItem('token') || '';
  const showToast = useToast();
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const fetchAnnouncements = useCallback((authToken = token) => {
    fetch(`${API_URL}/api/announcements`, {
      headers: authToken ? {
        'Authorization': `Bearer ${authToken}`
      } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnnouncements(data.data);
        }
      })
      .catch(err => console.error("Failed to fetch announcements:", err));
  }, [token]);

  useEffect(() => {
    fetchAnnouncements(token);
  }, [fetchAnnouncements, token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    // The backend requires title and content. We use description for content,
    // and derive a title from it (or just use a generic title if it's short).
    const title = description.length > 50 ? description.substring(0, 47) + '...' : description;
    
    // Format date and time if provided
    let event_date = null;
    if (date) {
      const timeStr = time ? `${time}:00` : '00:00:00';
      event_date = `${date}T${timeStr}`;
    }

    const payload = {
      title,
      content: description,
      category: 'Update',
      event_date
    };

    try {
      const res = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        // Reset form and refetch
        setDescription('');
        setDate('');
        setTime('');
        setShowForm(false);
        fetchAnnouncements(token);
      } else {
        showToast(data.message || 'Failed to create announcement', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while creating the announcement.', 'error');
    }
  };


  const canCreate = role === 'admin' || role === 'manager';

  return (
    <div className="announcements-page">
      <div className="announcements-header">
        <h1>Announcements</h1>
        {canCreate && !showForm && (
          <button className="create-btn" onClick={() => setShowForm(true)}>
            + Create an announcement
          </button>
        )}
      </div>

      {showForm && (
        <div className="create-form-modal">
          <h3>Create New Announcement</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Description (Next IUPC / ICPC regional / NCPC / Next tfc date / etc)</label>
              <textarea 
                className="form-textarea" 
                rows="4"
                placeholder="Enter announcement details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Date (Optional)</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
              <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="announcements-list">
        {announcements.length > 0 ? (
          announcements.map((a) => {
            // We use event_date for the box, fallback to created_at if no event_date
            const dateData = formatDateBox(a.event_date || a.created_at);
            
            return (
              <div key={a.post_id} className="announcement-card">
                <div className="announcement-description">
                  {/* Since description is content, we render content. 
                      We can also render title if we wanted, but the design 
                      requested a description block. */}
                  {a.content}
                </div>
                
                <div className={`announcement-date-box ${!dateData ? 'no-date' : ''}`}>
                  {dateData ? (
                    <>
                      <div className="date-day">{dateData.day}</div>
                      <div className="date-month-year">{dateData.monthYear}</div>
                      {dateData.timeStr && (
                        <div style={{ marginTop: '8px', fontSize: '15px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace", color: '#0f766e' }}>
                          {dateData.timeStr}
                        </div>
                      )}
                    </>
                  ) : (
                    // Blank if no date
                    <span></span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">No announcements available at the moment.</div>
        )}
      </div>
    </div>
  );
}
