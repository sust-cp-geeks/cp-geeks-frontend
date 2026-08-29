import { API_URL } from '../api';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './RightSidebar.css';

const RightSidebar = () => {
  const [profile, setProfile] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const lastFetchedTokenRef = useRef(null);
  const debounceTimerRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // Tracked so the dropdown can always say something — searching, no matches,
  // or a failure — instead of silently rendering nothing.
  const [searchState, setSearchState] = useState('idle'); // idle | loading | done | error
  const [searchOpen, setSearchOpen] = useState(false);

  // Debounced search — waits 300ms after user stops typing
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim() === '') {
      setSearchResults([]);
      setSearchState('idle');
      return;
    }

    setSearchState('loading');
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/search?name=${encodeURIComponent(val)}`);
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.data)) {
          setSearchResults(data.data);
          setSearchState('done');
        } else {
          setSearchResults([]);
          setSearchState('error');
        }
      } catch (err) {
        console.error('User search failed:', err);
        setSearchResults([]);
        setSearchState('error');
      }
    }, 300);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleUserSelect = (id) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchState('idle');
    setSearchOpen(false);
    navigate(`/profile/${id}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      handleUserSelect(searchResults[0].user_id);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Only refetch when the token actually changes (login/logout)
    if (token && token !== lastFetchedTokenRef.current) {
      lastFetchedTokenRef.current = token;
      fetch(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data);
        } else {
          setProfile({ name: 'CPGeek Member', is_admin: false, is_manager: false, codeforces_handle: 'cpgeek_user', vjudge_handle: 'vj_user', reg_number: '2020331000' });
        }
      })
      .catch(() => {
        setProfile({ name: 'CPGeek Member', is_admin: false, is_manager: false, codeforces_handle: 'cpgeek_user', vjudge_handle: 'vj_user', reg_number: '2020331000' });
      });
    } else if (!token) {
      // Sidebar renders null without a token, so no state reset needed
      lastFetchedTokenRef.current = null;
    }
  }, [location.pathname]);

  if (!localStorage.getItem('token')) return null;
  // If on auth page, don't show sidebar
  if (location.pathname === '/auth') return null;

  const initials = (profile?.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const roleLabel = profile?.is_admin ? 'Admin' : profile?.is_manager ? 'Manager' : 'Student';

  return (
    <aside className="right-sidebar">
      <div className="sidebar-widget search-widget">
        <h3 className="widget-header">Find Users</h3>
        <div className="widget-body search-widget-body">
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            aria-label="Search members by name"
          />
          {searchOpen && searchQuery.trim() !== '' && (
            <ul className="sidebar-search-results">
              {searchState === 'loading' && (
                <li className="search-note">Searching…</li>
              )}
              {searchState === 'error' && (
                <li className="search-note">Search unavailable — try again.</li>
              )}
              {searchState === 'done' && searchResults.length === 0 && (
                <li className="search-note">No members found.</li>
              )}
              {searchResults.map((u) => (
                <li
                  key={u.user_id}
                  className="search-hit"
                  /* mousedown fires before the input's blur, so the click always lands */
                  onMouseDown={(e) => { e.preventDefault(); handleUserSelect(u.user_id); }}
                >
                  <span className="search-hit-name">{u.name}</span>
                  {u.reg_number && <span className="search-hit-reg">{u.reg_number}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Compact identity only — the full detail lives on /profile, so this
          no longer duplicates it. */}
      <div className="sidebar-widget profile-widget">
        <h3 className="widget-header">You</h3>
        {profile ? (
          <Link to="/profile" className="widget-body sidebar-me">
            <span className="sidebar-me-avatar" aria-hidden="true">{initials || '?'}</span>
            <span className="sidebar-me-text">
              <span className="sidebar-me-name">{profile.name}</span>
              <span className="sidebar-me-role">{roleLabel}</span>
            </span>
            <span className="sidebar-me-go" aria-hidden="true">→</span>
          </Link>
        ) : (
          <div className="widget-body loading-text">Loading profile...</div>
        )}
      </div>

    </aside>
  );
};

export default React.memo(RightSidebar);
