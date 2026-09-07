import { API_URL, toApiDate, parseApiDate } from '../api';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Announcements.css';

// URLs inside content are detected as plain text and rendered as elements —
// never by injecting HTML, which would be an injection hole now managers post.
const linkifyContent = (text) =>
  String(text ?? '').split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="ann-inline-link">{part}</a>
      : part
  );

const formatDateBox = (isoString) => {
  const d = parseApiDate(isoString);
  if (!d) return null;
  
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
  const [loadError, setLoadError] = useState(null);
  const role = localStorage.getItem('role') || '';
  const token = localStorage.getItem('token') || '';
  const showToast = useToast();
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  // null while creating, a post_id while editing — the same form serves both
  const [editingId, setEditingId] = useState(null);
  // which card is asking "are you sure?"; deletion has no undo
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // List filters (B3)
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUpcoming, setFilterUpcoming] = useState(false);

  const isFiltered = Boolean(filterCategory) || filterUpcoming;

  const fetchAnnouncements = useCallback((authToken = token) => {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    if (filterUpcoming) params.set('upcoming', 'true');
    const query = params.toString();

    fetch(`${API_URL}/api/announcements${query ? `?${query}` : ''}`, {
      headers: authToken ? {
        'Authorization': `Bearer ${authToken}`
      } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setAnnouncements(data.data);
          setLoadError(null);
        } else {
          // a quiet noticeboard is not the same as one we could not read
          setAnnouncements([]);
          setLoadError('Could not load announcements. Try again shortly.');
        }
      })
      .catch(() => {
        setAnnouncements([]);
        setLoadError('Could not reach the server. Check your connection.');
      });
  }, [token, filterCategory, filterUpcoming]);

  useEffect(() => {
    fetchAnnouncements(token);
  }, [fetchAnnouncements, token]);

  // Public endpoint, no token. The set is fixed server-side and free text is
  // now rejected, so the dropdown is built from whatever it returns.
  useEffect(() => {
    fetch(`${API_URL}/api/announcements/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setCategories(data.data);
      })
      .catch(() => setCategories([]));
  }, []);

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setDescription('');
    setLinkUrl('');
    setLinkLabel('');
    setIsPinned(false);
    setDate('');
    setTime('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (a) => {
    setEditingId(a.post_id);
    setTitle(a.title || '');
    setCategory(a.category || '');
    setDescription(a.content || '');
    setLinkUrl(a.link_url || '');
    setLinkLabel(a.link_label || '');
    setIsPinned(Boolean(a.is_pinned));
    // split the stored string rather than going through Date. the api sends a
    // naive timestamp and toApiDate builds one, so string handling round-trips
    // exactly; a Date would apply the timezone and quietly shift the time by
    // six hours every time someone edited an unrelated field.
    const [d, t] = String(a.event_date || '').split('T');
    setDate(d || '');
    setTime(t ? t.slice(0, 5) : '');
    setShowForm(true);
    setConfirmDeleteId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setConfirmDeleteId(null);
        // if the post being edited was the one deleted, close the form too
        if (editingId === id) resetForm();
        fetchAnnouncements(token);
      } else {
        showToast(data.error || data.message || 'Could not delete the announcement.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not reach the server. Try again shortly.', 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) return;

    const payload = {
      title,
      content: description,
      category,
      event_date: toApiDate(date, time),
      is_pinned: isPinned,
      // Sending both replaces the pair; "" clears both server-side.
      link_url: linkUrl.trim(),
      link_label: linkUrl.trim() ? linkLabel.trim() : ''
    };

    try {
      const editing = editingId !== null;
      const res = await fetch(
        editing ? `${API_URL}/api/announcements/${editingId}` : `${API_URL}/api/announcements`,
        {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        resetForm();
        fetchAnnouncements(token);
      } else {
        showToast(
          data.error || data.message ||
            (editing ? 'Failed to update announcement' : 'Failed to create announcement'),
          'error'
        );
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while saving the announcement.', 'error');
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

      <div className="announcements-filters">
        <select
          className="form-select"
          aria-label="Filter by category"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="ann-pin-toggle">
          <input
            type="checkbox"
            checked={filterUpcoming}
            onChange={(e) => setFilterUpcoming(e.target.checked)}
          />
          <span>Upcoming only</span>
        </label>
      </div>

      {showForm && (
        <div className="create-form-modal">
          <h3>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="ann-title">Title</label>
              <input
                type="text"
                id="ann-title"
                className="form-input"
                placeholder="e.g. TFC Round 8 Registration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ann-category">Category</label>
              <select
                id="ann-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="" disabled>Select a category…</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
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
                <label htmlFor="ann-link-url">Link URL (Optional)</label>
                <input
                  type="url"
                  id="ann-link-url"
                  className="form-input"
                  placeholder="https://vjudge.net/contest/650000"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="ann-link-label">Link Label (Optional)</label>
                <input
                  type="text"
                  id="ann-link-label"
                  className="form-input"
                  placeholder="Register here"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  disabled={!linkUrl.trim()}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="ann-pin-toggle">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                <span>Pin this announcement to the top</span>
              </label>
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
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                {editingId ? 'Save changes' : 'Publish announcement'}
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
              <div key={a.post_id} className={`announcement-card ${a.is_pinned ? 'is-pinned' : ''}`}>
                <div className="announcement-description">
                  {(a.is_pinned || a.category) && (
                    <div className="ann-badges">
                      {a.is_pinned && <span className="ann-badge ann-badge-pinned">Pinned</span>}
                      {a.category && <span className="ann-badge">{a.category}</span>}
                    </div>
                  )}

                  {a.title && <h3 className="ann-title">{a.title}</h3>}

                  <div className="ann-body">{linkifyContent(a.content)}</div>

                  {(a.contest_title || a.event_id) && (
                    <div className="ann-relations">
                      {a.contest_title && (
                        <span className="ann-relation">Contest: {a.contest_title}</span>
                      )}
                      {a.event_id && (
                        <Link className="ann-relation ann-relation-link" to={`/events/${a.event_id}`}>
                          Event: {a.event_description || `#${a.event_id}`}
                        </Link>
                      )}
                    </div>
                  )}

                  {a.link_url && (
                    <a
                      className="ann-link-btn"
                      href={a.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {a.link_label || 'Open link'}
                    </a>
                  )}

                  <div className="ann-byline">
                    <span>{a.author_name || 'Unknown'}</span>
                    {a.updated_at && <span className="ann-edited">· edited</span>}
                  </div>

                  {canCreate && (
                    <div className="ann-actions">
                      {confirmDeleteId === a.post_id ? (
                        <>
                          {/* deleting is permanent — there is no undo and no
                              recycle bin, so it takes a second deliberate click */}
                          <span className="ann-confirm-text">Delete permanently?</span>
                          <button
                            type="button"
                            className="ann-action ann-action-danger"
                            onClick={() => handleDelete(a.post_id)}
                          >
                            Yes, delete
                          </button>
                          <button
                            type="button"
                            className="ann-action"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Keep
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="ann-action"
                            onClick={() => startEdit(a)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ann-action ann-action-danger"
                            onClick={() => setConfirmDeleteId(a.post_id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className={`announcement-date-box ${!dateData ? 'no-date' : ''}`}>
                  {dateData ? (
                    <>
                      <div className="date-day">{dateData.day}</div>
                      <div className="date-month-year">{dateData.monthYear}</div>
                      {dateData.timeStr && (
                        <div style={{ marginTop: '8px', fontSize: '15px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
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
          <div className="empty-state">
            {loadError || (isFiltered
              ? 'No announcements match these filters.'
              : 'No announcements yet.')}
          </div>
        )}
      </div>
    </div>
  );
}
