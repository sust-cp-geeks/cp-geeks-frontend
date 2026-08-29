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

const DEFAULT_ANNOUNCEMENTS = [
  {
    post_id: 101,
    title: "SUST IUPC 2026 Selection Contest",
    content: "SUST IUPC 2026 Selection Contest will be held on April 28th at 8:00 PM BST. All registered students are required to participate.",
    category: "Contest",
    event_date: "2026-04-28T20:00:00.000Z",
    created_at: "2026-04-20T10:00:00.000Z"
  },
  {
    post_id: 102,
    title: "Weekly Practice Round #14 Announced",
    content: "Weekly Practice Round #14 is now live on Codeforces. Target ratings: 800-2000.",
    category: "Update",
    event_date: "2026-04-27T20:00:00.000Z",
    created_at: "2026-04-18T12:00:00.000Z"
  },
  {
    post_id: 103,
    title: "ICPC Dhaka Regional 2026 Team Formation",
    content: "Registration for SUST Team Formation Contest (TFC) for ICPC Dhaka Regional is open now.",
    category: "Contest",
    event_date: "2026-05-05T15:00:00.000Z",
    created_at: "2026-04-15T09:00:00.000Z"
  }
];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
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
          // Placeholder data would misrepresent an empty filter result, so it
          // only stands in for an unfiltered list that came back empty.
          setAnnouncements(
            data.data.length > 0 ? data.data : (isFiltered ? [] : DEFAULT_ANNOUNCEMENTS)
          );
        } else {
          setAnnouncements(isFiltered ? [] : DEFAULT_ANNOUNCEMENTS);
        }
      })
      .catch(() => {
        setAnnouncements(isFiltered ? [] : DEFAULT_ANNOUNCEMENTS);
      });
  }, [token, filterCategory, filterUpcoming, isFiltered]);

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
        setTitle('');
        setCategory('');
        setDescription('');
        setLinkUrl('');
        setLinkLabel('');
        setIsPinned(false);
        setDate('');
        setTime('');
        setShowForm(false);
        fetchAnnouncements(token);
      } else {
        showToast(data.error || data.message || 'Failed to create announcement', 'error');
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
          <h3>Create New Announcement</h3>
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
            {isFiltered
              ? 'No announcements match these filters.'
              : 'No announcements available at the moment.'}
          </div>
        )}
      </div>
    </div>
  );
}
