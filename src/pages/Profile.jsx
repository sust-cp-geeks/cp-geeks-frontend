import { API_URL } from '../api';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Profile.css';
import '../components/Skeleton.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editable fields
  const [name, setName] = useState('');
  const [vjudgeHandle, setVjudgeHandle] = useState('');
  const [cfHandle, setCfHandle] = useState('');
  // Server 400s are written for humans, so they are shown on the field.
  const [fieldError, setFieldError] = useState('');

  const navigate = useNavigate();
  const showToast = useToast();
  const { id } = useParams();

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token && !id) {
      navigate('/auth');
      return;
    }

    try {
      const url = id 
        ? `${API_URL}/api/users/${id}` 
        : `${API_URL}/api/users/me`;
        
      const response = await fetch(url, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        setProfile(data);
        setName(data.name || '');
        setVjudgeHandle(data.vjudge_handle || '');
        setCfHandle(data.codeforces_handle || '');
      } else if (response.status !== 401) {
        // 401 is handled globally by the session guard in api.js — it clears
        // both token and role and redirects, which this branch did not.
        setError('Failed to fetch profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [id, fetchProfile]);


  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    // Mirrors the server's limits so an over-long value is caught before the
    // round trip. Counted in characters, not bytes — Bengali names are fine.
    const trimmedName = name.trim();
    const nameLength = [...trimmedName].length;
    if (nameLength < 2 || nameLength > 100) {
      setFieldError('Name must be between 2 and 100 characters.');
      return;
    }
    if ([...cfHandle.trim()].length > 50) {
      setFieldError('Codeforces handle must be 50 characters or fewer.');
      return;
    }
    if ([...vjudgeHandle.trim()].length > 100) {
      setFieldError('VJudge handle must be 100 characters or fewer.');
      return;
    }
    setFieldError('');

    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: trimmedName,
          // An empty string is the documented way to clear a handle.
          vjudge_handle: vjudgeHandle.trim(),
          codeforces_handle: cfHandle.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setFieldError('');
        setIsEditing(false);
        // show success alert or toast
        showToast('Profile updated successfully!', 'success');
      } else {
        const errData = await response.json().catch(() => ({}));
        const message = errData.error || errData.message || 'Unknown error';
        setFieldError(message);
        showToast(`Failed to update profile: ${message}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not connect to the server.', 'error');
    }
  };

  if (error) return <div className="profile-error">{error}</div>;

  // Monogram stands in for an avatar — the API has no image for members.
  const initials = (profile?.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const roleLabel = profile?.is_admin ? 'Admin' : profile?.is_manager ? 'Manager' : 'Student';
  const roleTone = profile?.is_admin ? 'is-admin' : profile?.is_manager ? 'is-manager' : 'is-student';

  const handles = [
    {
      key: 'cf',
      platform: 'Codeforces',
      handle: profile?.codeforces_handle,
      href: profile?.codeforces_handle
        ? `https://codeforces.com/profile/${profile.codeforces_handle}`
        : null,
    },
    {
      key: 'vj',
      platform: 'VJudge',
      handle: profile?.vjudge_handle,
      href: profile?.vjudge_handle
        ? `https://vjudge.net/user/${profile.vjudge_handle}`
        : null,
    },
  ];

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        <div className="profile-card">
          {loading ? (
            <div className="skeleton-container">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text medium"></div>
              <div style={{ marginTop: '2rem' }}>
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
              </div>
            </div>
          ) : (
            <>
              <header className="profile-identity">
                <div className="profile-avatar" aria-hidden="true">{initials || '?'}</div>
                <div className="profile-identity-text">
                  <h1>{profile?.name}</h1>
                  <div className="profile-meta">
                    <span className={`role-badge ${roleTone}`}>{roleLabel}</span>
                    {profile?.reg_number && (
                      <span className="profile-reg">{profile.reg_number}</span>
                    )}
                  </div>
                </div>
                {!id && !isEditing && (
                  <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
                    Edit Profile
                  </button>
                )}
              </header>

              {isEditing ? (
                <form onSubmit={handleSave} className="profile-edit-form">
                  <div className="form-group">
                    <label htmlFor="edit-name">Full Name</label>
                    <input
                      type="text"
                      id="edit-name"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      minLength={2}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-cf">Codeforces Handle</label>
                    <input
                      type="text"
                      id="edit-cf"
                      className="form-input"
                      value={cfHandle}
                      onChange={(e) => setCfHandle(e.target.value)}
                      maxLength={50}
                      placeholder="e.g. tourist — leave blank to remove"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-vjudge">Vjudge Handle</label>
                    <input
                      type="text"
                      id="edit-vjudge"
                      className="form-input"
                      value={vjudgeHandle}
                      onChange={(e) => setVjudgeHandle(e.target.value)}
                      maxLength={100}
                      placeholder="e.g. tourist — leave blank to remove"
                    />
                  </div>

                  {fieldError && <p className="profile-field-error">{fieldError}</p>}

                  <div className="profile-actions">
                    <button type="button" className="cancel-btn" onClick={() => { setFieldError(''); setIsEditing(false); }}>
                      Cancel
                    </button>
                    <button type="submit" className="save-btn">
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <section className="profile-section">
                    <h2 className="profile-section-title">Account</h2>
                    <dl className="profile-grid">
                      <div className="profile-field">
                        <dt>Email address</dt>
                        <dd>{profile?.email || '—'}</dd>
                      </div>
                      <div className="profile-field">
                        <dt>Registration number</dt>
                        <dd className="is-numeric">{profile?.reg_number || '—'}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="profile-section">
                    <h2 className="profile-section-title">Competitive Programming</h2>
                    <div className="handle-cards">
                      {handles.map(({ key, platform, handle, href }) => (
                        href ? (
                          <a
                            key={key}
                            className="handle-card"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className="handle-platform">{platform}</span>
                            <span className="handle-value">{handle}</span>
                            <span className="handle-go" aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <div key={key} className="handle-card is-empty">
                            <span className="handle-platform">{platform}</span>
                            <span className="handle-value">Not linked</span>
                          </div>
                        )
                      ))}
                    </div>
                    {!id && (
                      <p className="profile-note">
                        One Codeforces and one VJudge account per member for now.
                      </p>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
