import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Events.css';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [role, setRole] = useState('');
  const [token, setToken] = useState('');
  
  // Event form states
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Team form states
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [coachName, setCoachName] = useState('');
  const [members, setMembers] = useState(['', '', '']); // Exactly 3 members

  const [expandedEvents, setExpandedEvents] = useState({});

  useEffect(() => {
    setRole(localStorage.getItem('role') || '');
    const currentToken = localStorage.getItem('token') || '';
    setToken(currentToken);
    fetchEvents(currentToken);
  }, []);

  const fetchEvents = (authToken = token) => {
    fetch('http://localhost:8080/api/events', {
      headers: authToken ? {
        'Authorization': `Bearer ${authToken}`
      } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEvents(data.data);
        }
      })
      .catch(err => console.error("Failed to fetch events:", err));
  };

  const openEventForm = (eventToEdit = null) => {
    if (eventToEdit) {
      setEditingEventId(eventToEdit.event_id);
      setDescription(eventToEdit.description);
      if (eventToEdit.event_date) {
        const [d, t] = eventToEdit.event_date.split('T');
        setDate(d || '');
        setTime(t ? t.substring(0, 5) : '');
      }
    } else {
      setEditingEventId(null);
      setDescription('');
      setDate('');
      setTime('');
    }
    setShowEventForm(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!description.trim() || !date) return;

    const timeStr = time ? `${time}:00` : '00:00:00';
    const event_date = `${date}T${timeStr}`;

    const payload = {
      description,
      event_date
    };

    const url = editingEventId 
      ? `http://localhost:8080/api/events/${editingEventId}`
      : 'http://localhost:8080/api/events';
    const method = editingEventId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        setDescription('');
        setDate('');
        setTime('');
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents(token);
      } else {
        alert(data.message || 'Failed to delete event');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting event.');
    }
  };

  const openTeamForm = (eventId, teamToEdit = null) => {
    setSelectedEventId(eventId);
    setExpandedEvents(prev => ({ ...prev, [eventId]: true })); // Auto-expand
    if (teamToEdit) {
      setEditingTeamId(teamToEdit.team_id);
      setCoachName(teamToEdit.coach_name || '');
      const mems = teamToEdit.members.map(m => m.reg_number);
      while(mems.length < 3) mems.push('');
      setMembers(mems.slice(0, 3));
    } else {
      setEditingTeamId(null);
      setCoachName('');
      setMembers(['', '', '']);
    }
    setShowTeamForm(true);
  };

  const handleTeamMemberChange = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (members.some(m => !m.trim())) {
      alert("All 3 team members are required.");
      return;
    }

    const payload = {
      coach_name: coachName.trim() || null,
      members: members.map(m => m.trim())
    };

    const url = editingTeamId 
      ? `http://localhost:8080/api/events/${selectedEventId}/teams/${editingTeamId}`
      : `http://localhost:8080/api/events/${selectedEventId}/teams`;
    
    const method = editingTeamId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowTeamForm(false);
        fetchEvents(token);
      } else {
        alert(data.message || 'Failed to save team');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving team.');
    }
  };

  const handleDeleteTeam = async (eventId, teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/events/${eventId}/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents(token);
      } else {
        alert(data.message || 'Failed to delete team');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting team.');
    }
  };

  const toggleExpand = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const formatDateBox = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    
    const day = d.getDate();
    const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
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

  const canEdit = role === 'admin' || role === 'manager';

  const renderTeamForm = () => (
    <div className="create-form-modal" style={{ marginBottom: '1rem', marginTop: '1rem', border: '2px solid #3C3489' }}>
      <h3>{editingTeamId ? 'Edit Team' : 'Add Team'}</h3>
      <form onSubmit={handleSaveTeam}>
        <div className="form-group">
          <label>Coach Name (Optional)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Coach Name"
            value={coachName}
            onChange={(e) => setCoachName(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Team Member 1 (Registration Number)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. 2019331000"
            value={members[0]}
            onChange={(e) => handleTeamMemberChange(0, e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Team Member 2 (Registration Number)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. 2019331001"
            value={members[1]}
            onChange={(e) => handleTeamMemberChange(1, e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Team Member 3 (Registration Number)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. 2019331002"
            value={members[2]}
            onChange={(e) => handleTeamMemberChange(2, e.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => setShowTeamForm(false)}>
            Cancel
          </button>
          <button type="submit" className="save-btn">
            Save Team
          </button>
        </div>
      </form>
    </div>
  );

  const renderEventForm = () => (
    <div className="create-form-modal" style={{ marginBottom: '1rem', marginTop: '1rem', border: '2px solid #3C3489' }}>
      <h3>{editingEventId ? 'Edit Event' : 'Create New Event'}</h3>
      <form onSubmit={handleSaveEvent}>
        <div className="form-group">
          <label>Event Description</label>
          <textarea 
            className="form-textarea" 
            rows="4"
            placeholder="Enter event details..."
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
          <button type="button" className="cancel-btn" onClick={() => setShowEventForm(false)}>
            Cancel
          </button>
          <button type="submit" className="save-btn">
            Save Event
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Events</h1>
        {canEdit && (!showEventForm || editingEventId) && (
          <button className="create-btn" onClick={() => openEventForm()}>
            + Create an event
          </button>
        )}
      </div>

      {showEventForm && !editingEventId && renderEventForm()}

      {/* Removed global team form block from here */}

      <div className="events-list">
        {events.length > 0 ? (
          events.map((event) => {
            const dateData = formatDateBox(event.event_date);
            const isExpanded = expandedEvents[event.event_id];
            
            return (
              <div key={event.event_id} className="event-card-container">
                <div className="event-card">
                  <div className="event-description">
                    {event.description}
                  </div>
                  
                  <div className="event-actions">
                    {canEdit && (
                      <div className="admin-actions">
                        <button className="action-btn add-team-btn" onClick={() => openTeamForm(event.event_id)}>
                          + Add Team
                        </button>
                        <button className="action-btn edit-team-btn" onClick={() => openEventForm(event)}>
                          Edit
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDeleteEvent(event.event_id)}>
                          Delete
                        </button>
                      </div>
                    )}

                    <div className="event-expand-toggle">
                      <button className="action-btn expand-btn" onClick={() => toggleExpand(event.event_id)}>
                        {isExpanded ? 'Hide Teams' : `View Teams (${event.teams?.length || 0})`}
                      </button>
                    </div>

                    <div className={`event-date-box ${!dateData ? 'no-date' : ''}`}>
                      {dateData ? (
                        <>
                          <div className="date-day">{dateData.day}</div>
                          <div className="date-month-year">{dateData.monthYear}</div>
                          {dateData.timeStr && (
                            <div className="date-time">
                              {dateData.timeStr}
                            </div>
                          )}
                        </>
                      ) : (
                        <span></span>
                      )}
                    </div>
                  </div>
                </div>

                {showEventForm && editingEventId === event.event_id && renderEventForm()}

                {isExpanded && (
                  <div className="teams-container">
                    {event.teams && event.teams.length > 0 ? (
                      <>
                        {event.teams.map((team, index) => (
                          <React.Fragment key={team.team_id}>
                            {showTeamForm && editingTeamId === team.team_id ? (
                              renderTeamForm()
                            ) : (
                              <div className="team-card">
                                <div className="team-info">
                                  <span className="team-id-badge">Team {index + 1}</span>
                                  {team.coach_name && (
                                    <span className="team-coach">Coach: {team.coach_name}</span>
                                  )}
                                </div>
                                
                                <div className="team-members">
                                  {team.members.map(member => (
                                    <div key={member.member_id} className="team-member">
                                      {member.user_id ? (
                                        <Link to={`/profile/${member.user_id}`} className="member-link">
                                          <span className="member-name">{member.name}</span>
                                          <span className="member-reg">({member.reg_number})</span>
                                        </Link>
                                      ) : (
                                        <div className="member-unlinked">
                                          <span className="member-reg">{member.reg_number}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {canEdit && (
                                  <div className="team-admin-actions">
                                    <button className="action-btn edit-team-btn" onClick={() => openTeamForm(event.event_id, team)}>
                                      Edit
                                    </button>
                                    <button className="action-btn delete-btn" onClick={() => handleDeleteTeam(event.event_id, team.team_id)}>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                        {showTeamForm && selectedEventId === event.event_id && !editingTeamId && renderTeamForm()}
                      </>
                    ) : (
                      <>
                        <div className="no-teams">No teams have been added to this event yet.</div>
                        {showTeamForm && selectedEventId === event.event_id && !editingTeamId && renderTeamForm()}
                      </>
                    )}
                  </div>
                )}
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
