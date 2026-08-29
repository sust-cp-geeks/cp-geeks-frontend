import { API_URL } from '../api';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './AdminUsers.css';

const STATUSES = ['pending', 'active', 'rejected'];

// Signed ID card URLs live for 5 minutes, so they are fetched when a reviewer
// opens a card — never when the list loads.
const CARD_TTL_FALLBACK = 300;

function IdCardReview({ user, token, onClose, onDecision }) {
  const showToast = useToast();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const loadCard = useCallback(async () => {
    setLoading(true);
    setMissing(false);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.user_id}/id-card`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCard(data.data || data);
        setSecondsLeft((data.data || data)?.expires_in_seconds || CARD_TTL_FALLBACK);
      } else if (res.status === 404) {
        // No card on file: a university-email signup, or already decided.
        setMissing(true);
      } else {
        showToast(data.error || 'Could not load the ID card.', 'error');
      }
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.user_id, token, showToast]);

  useEffect(() => { loadCard(); }, [loadCard]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const decide = async (action) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.user_id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(action === 'reject' && reason.trim() ? { reason: reason.trim() } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`${user.name} ${action === 'approve' ? 'approved' : 'rejected'}.`, 'success');
        onDecision(user.user_id);
      } else {
        showToast(data.error || `Could not ${action} this user.`, 'error');
      }
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const expired = secondsLeft <= 0 && card;

  return (
    <div className="admin-review-backdrop" onClick={onClose}>
      <div className="admin-review" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Review ${user.name}`}>
        <div className="admin-review-head">
          <div>
            <h2>{user.name}</h2>
            <p className="admin-review-sub">
              {user.reg_number} · {user.email}
            </p>
          </div>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {loading && <p className="admin-muted">Loading ID card…</p>}

        {missing && (
          <p className="admin-muted">
            No ID card on file — this account either registered with a university address
            or has already been decided.
          </p>
        )}

        {card && (
          <>
            <p className={`admin-ttl ${expired ? 'is-expired' : ''}`}>
              {expired
                ? 'These links have expired.'
                : `Links expire in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
              {expired && (
                <button type="button" className="admin-link-btn" onClick={loadCard}>Reload</button>
              )}
            </p>
            <div className="admin-card-pair">
              <figure>
                <img src={card.front_url} alt={`${user.name} ID card front`} />
                <figcaption>Front</figcaption>
              </figure>
              <figure>
                <img src={card.back_url} alt={`${user.name} ID card back`} />
                <figcaption>Back</figcaption>
              </figure>
            </div>
          </>
        )}

        <div className="admin-review-actions">
          <input
            type="text"
            className="form-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional, sent on reject)"
          />
          <div className="admin-btn-row">
            <button type="button" className="admin-btn admin-btn-reject" disabled={busy} onClick={() => decide('reject')}>
              Reject
            </button>
            <button type="button" className="admin-btn admin-btn-approve" disabled={busy} onClick={() => decide('approve')}>
              Approve
            </button>
          </div>
          <p className="admin-hint">Either decision permanently deletes the ID card photos.</p>
        </div>
      </div>
    </div>
  );
}

function AdminUsers() {
  const navigate = useNavigate();
  const showToast = useToast();
  const token = localStorage.getItem('token') || '';
  const role = localStorage.getItem('role') || '';

  const [status, setStatus] = useState('pending');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [emailEdit, setEmailEdit] = useState({ id: null, value: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (role !== 'admin') navigate('/announcements', { replace: true });
  }, [role, navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users?status=${status}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUsers(Array.isArray(data.data) ? data.data : []);
      } else if (res.status !== 401) {
        showToast(data.error || 'Could not load users.', 'error');
        setUsers([]);
      }
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, token, showToast]);

  useEffect(() => { if (role === 'admin') fetchUsers(); }, [fetchUsers, role]);

  const act = async (userId, path, method = 'PUT', body) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Done.', 'success');
        fetchUsers();
        return true;
      }
      showToast(data.error || 'That action was refused.', 'error');
      return false;
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
      return false;
    }
  };

  if (role !== 'admin') return null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>User Administration</h1>
        <p className="admin-muted">
          Manual signups land in <strong>pending</strong> and cannot log in until reviewed.
        </p>
      </div>

      <div className="admin-tabs">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`admin-tab ${status === s ? 'is-active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
        <button type="button" className="admin-link-btn" onClick={fetchUsers}>Refresh</button>
      </div>

      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : users.length === 0 ? (
        <p className="admin-muted">No {status} accounts.</p>
      ) : (
        <div className="admin-grid">
          {users.map((u) => (
            <div key={u.user_id} className="admin-user-card">
              <div className="admin-user-top">
                <h3>{u.name}</h3>
                <span className="admin-reg">{u.reg_number}</span>
              </div>
              <p className="admin-user-email">{u.email}</p>
              {(u.codeforces_handle || u.vjudge_handle) && (
                <p className="admin-user-handles">
                  {u.codeforces_handle && <span>CF: {u.codeforces_handle}</span>}
                  {u.vjudge_handle && <span>VJ: {u.vjudge_handle}</span>}
                </p>
              )}

              <div className="admin-btn-row">
                {status === 'pending' && (
                  <button type="button" className="admin-btn admin-btn-primary" onClick={() => setReviewing(u)}>
                    Review ID card
                  </button>
                )}
                {status === 'rejected' && (
                  <button type="button" className="admin-btn" onClick={() => act(u.user_id, '/reactivate')}>
                    Reactivate
                  </button>
                )}
                {status === 'active' && (
                  <button type="button" className="admin-btn" onClick={() => act(u.user_id, '/ban')}>
                    Ban
                  </button>
                )}
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setEmailEdit({ id: u.user_id, value: u.email })}
                >
                  Fix email
                </button>
              </div>

              {emailEdit.id === u.user_id && (
                <div className="admin-inline-form">
                  <input
                    type="email"
                    className="form-input"
                    value={emailEdit.value}
                    onChange={(e) => setEmailEdit({ ...emailEdit, value: e.target.value })}
                  />
                  <div className="admin-btn-row">
                    <button type="button" className="admin-btn" onClick={() => setEmailEdit({ id: null, value: '' })}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={async () => {
                        const ok = await act(u.user_id, '/email', 'PUT', { email: emailEdit.value.trim() });
                        if (ok) setEmailEdit({ id: null, value: '' });
                      }}
                    >
                      Save
                    </button>
                  </div>
                  <p className="admin-hint">This ends the user's sessions.</p>
                </div>
              )}

              <div className="admin-danger">
                {confirmDelete === u.user_id ? (
                  <div className="admin-inline-form">
                    <p className="admin-hint admin-hint-danger">
                      Permanently delete {u.name}? This cannot be undone.
                    </p>
                    <div className="admin-btn-row">
                      <button type="button" className="admin-btn" onClick={() => setConfirmDelete(null)}>
                        Keep
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-reject"
                        onClick={async () => {
                          await act(u.user_id, '', 'DELETE');
                          setConfirmDelete(null);
                        }}
                      >
                        Delete for good
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="admin-link-btn admin-link-danger" onClick={() => setConfirmDelete(u.user_id)}>
                    Delete account
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewing && (
        <IdCardReview
          user={reviewing}
          token={token}
          onClose={() => setReviewing(null)}
          onDecision={(id) => {
            setReviewing(null);
            setUsers((prev) => prev.filter((u) => u.user_id !== id));
          }}
        />
      )}
    </div>
  );
}

export default AdminUsers;
