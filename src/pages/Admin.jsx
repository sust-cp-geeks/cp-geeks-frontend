import React, { useState } from 'react';
import { useToast } from '../components/ToastContext';
import './Admin.css';

const Admin = () => {
  const showToast = useToast();
  const role = localStorage.getItem('role') || '';

  // Event creation (simple title)
  const [eventTitle, setEventTitle] = useState('');
  const handleEventCreate = (e) => {
    e.preventDefault();
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    events.push({ title: eventTitle, createdAt: new Date().toISOString() });
    localStorage.setItem('events', JSON.stringify(events));
    setEventTitle('');
    showToast('Event created successfully', 'success');
  };

  // News post creation
  const [postType, setPostType] = useState('contest');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [totalTeams, setTotalTeams] = useState('');
  const [teamMembers, setTeamMembers] = useState([{ m1: '', m2: '', m3: '', coach: '' }]);
  const [description, setDescription] = useState('');

  const handleNewsSubmit = (e) => {
    e.preventDefault();
    const posts = JSON.parse(localStorage.getItem('newsPosts') || '[]');
    const newPost = { type: postType, title };
    if (postType === 'contest') {
      newPost.date = date;
      newPost.time = time;
      newPost.place = place;
    } else if (postType === 'team') {
      newPost.totalTeams = totalTeams;
      newPost.teams = teamMembers;
    } else if (postType === 'general') {
      newPost.description = description;
    }
    posts.push(newPost);
    localStorage.setItem('newsPosts', JSON.stringify(posts));
    // reset fields
    setTitle(''); setDate(''); setTime(''); setPlace(''); setTotalTeams(''); setTeamMembers([{ m1: '', m2: '', m3: '', coach: '' }]); setDescription('');
    showToast('Post added successfully', 'success');
  };

  const updateTeamMember = (idx, field, value) => {
    const copy = [...teamMembers];
    copy[idx][field] = value;
    setTeamMembers(copy);
  };

  if (role !== 'admin') {
    return <div style={{ padding: '2rem' }}><h2>Access denied. Admin only.</h2></div>;
  }

  return (
    <div className="admin-page" style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <h1>Admin Dashboard</h1>

      {/* Event creation */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Create Event</h2>
        <form onSubmit={handleEventCreate} className="admin-form">
          <div className="form-group">
            <label>Event Title</label>
            <input className="form-input" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
          </div>
          <button type="submit" className="submit-btn">Create Event</button>
        </form>
      </section>

      {/* News/Announcement creation */}
      <section>
        <h2>Create News / Announcement</h2>
        <form onSubmit={handleNewsSubmit} className="admin-form">
          <div className="form-group">
            <label>Post Type</label>
            <select className="form-input" value={postType} onChange={(e) => setPostType(e.target.value)}>
              <option value="contest">Contest Date</option>
              <option value="team">Team Announcement</option>
              <option value="general">General Announcement</option>
            </select>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          {postType === 'contest' && (
            <>
              <div className="form-group"><label>Date</label><input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
              <div className="form-group"><label>Time</label><input type="time" className="form-input" value={time} onChange={(e) => setTime(e.target.value)} required /></div>
              <div className="form-group"><label>Place</label><input className="form-input" value={place} onChange={(e) => setPlace(e.target.value)} required /></div>
            </>
          )}
          {postType === 'team' && (
            <>
              <div className="form-group"><label>Total Teams</label><input type="number" className="form-input" value={totalTeams} onChange={(e) => setTotalTeams(e.target.value)} required /></div>
              {/* For simplicity, we allow entry for a single team; repeat as needed */}
              <div className="form-group"><label>Team Member 1</label><input className="form-input" value={teamMembers[0].m1} onChange={(e) => updateTeamMember(0, 'm1', e.target.value)} /></div>
              <div className="form-group"><label>Team Member 2</label><input className="form-input" value={teamMembers[0].m2} onChange={(e) => updateTeamMember(0, 'm2', e.target.value)} /></div>
              <div className="form-group"><label>Team Member 3</label><input className="form-input" value={teamMembers[0].m3} onChange={(e) => updateTeamMember(0, 'm3', e.target.value)} /></div>
              <div className="form-group"><label>Coach (optional)</label><input className="form-input" value={teamMembers[0].coach} onChange={(e) => updateTeamMember(0, 'coach', e.target.value)} /></div>
            </>
          )}
          {postType === 'general' && (
            <div className="form-group"><label>Description</label><textarea className="form-input" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
          )}
          <button type="submit" className="submit-btn">Add Post</button>
        </form>
      </section>
    </div>
  );
};

export default Admin;
