import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editable fields
  const [name, setName] = useState('');
  const [vjudgeHandle, setVjudgeHandle] = useState('');
  const [cfHandle, setCfHandle] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        setProfile(data);
        setName(data.name || '');
        setVjudgeHandle(data.vjudge_handle || '');
        setCfHandle(data.codeforces_handle || '');
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/auth');
        } else {
          setError('Failed to fetch profile.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8080/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          vjudge_handle: vjudgeHandle,
          codeforces_handle: cfHandle
        })
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setIsEditing(false);
        // show success alert or toast
        alert('Profile updated successfully!');
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Failed to update profile: ${errData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Could not connect to the server.');
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error}</div>;

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <h1>My Profile</h1>
            <p>Manage your account settings and competitive programming handles</p>
            <p style={{ fontSize: '0.85em', color: '#ff9800', marginTop: '0.5rem', fontStyle: 'italic' }}>
              * Note: You can only add 1 Codeforces and Vjudge account for now.
            </p>
          </div>

          <div className="profile-info-section">
            <div className="readonly-fields">
              <div className="info-group">
                <span className="info-label">Email Address</span>
                <span className="info-value">{profile?.email}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Registration Number</span>
                <span className="info-value">{profile?.reg_number}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Current Role</span>
                <span className="info-value role-badge">{localStorage.getItem('role') || 'Student'}</span>
              </div>
            </div>

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
                    placeholder="e.g. tourist"
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
                    placeholder="e.g. tourist"
                  />
                </div>

                <div className="profile-actions">
                  <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-view">
                <div className="info-group">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{profile?.name}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Codeforces Handle</span>
                  <span className="info-value">
                    {profile?.codeforces_handle ? (
                      <a href={`https://codeforces.com/profile/${profile.codeforces_handle}`} target="_blank" rel="noopener noreferrer" className="handle-link">
                        <span className="handle-badge codeforces">{profile.codeforces_handle}</span>
                      </a>
                    ) : (
                      <span className="no-handle">Not provided</span>
                    )}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">Vjudge Handle</span>
                  <span className="info-value">
                    {profile?.vjudge_handle ? (
                      <a href={`https://vjudge.net/user/${profile.vjudge_handle}`} target="_blank" rel="noopener noreferrer" className="handle-link">
                        <span className="handle-badge vjudge">{profile.vjudge_handle}</span>
                      </a>
                    ) : (
                      <span className="no-handle">Not provided</span>
                    )}
                  </span>
                </div>
                
                <div className="profile-actions-center">
                  <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
