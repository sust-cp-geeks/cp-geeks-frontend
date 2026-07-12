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

  // Debounced search — waits 300ms after user stops typing
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim() === '') {
      setSearchResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/search?name=${encodeURIComponent(val)}`);
        const data = await res.json().catch(()=>({}));
        if (data.success && data.data) {
          setSearchResults(data.data);
        }
      } catch (err) {
        console.error(err);
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
    navigate(`/profile/${id}`);
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
        }
      })
      .catch(console.error);
    } else if (!token && profile !== null) {
      lastFetchedTokenRef.current = null;
      const id = setTimeout(() => setProfile(null), 0);
      return () => clearTimeout(id);
    }
  }, [profile]);

  if (!localStorage.getItem('token')) return null;
  // If on auth page, don't show sidebar
  if (location.pathname === '/auth') return null;

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
            onBlur={() => setTimeout(() => setSearchResults([]), 200)}
          />
          {searchResults.length > 0 && (
            <ul className="sidebar-search-results">
              {searchResults.map(u => (
                <li key={u.user_id} onClick={() => handleUserSelect(u.user_id)}>
                  {u.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="sidebar-widget profile-widget">
        <h3 className="widget-header">
          User Profile
        </h3>
        {profile ? (
          <div className="widget-body">
            <div className="profile-main">
              <Link to="/profile" className="profile-name-link">
                {profile.name}
              </Link>
              <div className="profile-role">{profile.is_admin ? 'Admin' : (profile.is_manager ? 'Manager' : 'Student')}</div>
            </div>
            
            <ul className="profile-details">
              <li>
                <span className="label">Codeforces:</span>
                {profile.codeforces_handle ? (
                  <a href={`https://codeforces.com/profile/${profile.codeforces_handle}`} target="_blank" rel="noreferrer" className="cf-handle">
                    {profile.codeforces_handle}
                  </a>
                ) : <span className="na-text">N/A</span>}
              </li>
              <li>
                <span className="label">Vjudge:</span>
                {profile.vjudge_handle ? (
                  <a href={`https://vjudge.net/user/${profile.vjudge_handle}`} target="_blank" rel="noreferrer" className="vj-handle">
                    {profile.vjudge_handle}
                  </a>
                ) : <span className="na-text">N/A</span>}
              </li>
              <li>
                <span className="label">Reg No:</span>
                <span>{profile.reg_number}</span>
              </li>
            </ul>

            <div className="widget-actions">
              <Link to="/profile" className="widget-link">Edit Profile</Link>
            </div>
          </div>
        ) : (
          <div className="widget-body loading-text">Loading profile...</div>
        )}
      </div>

      <div className="sidebar-widget">
        <h3 className="widget-header">Pay attention</h3>
        <div className="widget-body">
          <ul className="attention-list">
            <li><Link to="/announcements">Check latest announcements</Link></li>
            <li><Link to="/events">Upcoming ICPC/NCPC Events</Link></li>
            <li><Link to="/contest">Next Vjudge Contest</Link></li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
