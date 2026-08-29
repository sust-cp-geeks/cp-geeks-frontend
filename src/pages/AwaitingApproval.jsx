import { API_URL } from '../api';
import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Auth.css';

const SUST_DOMAIN = '@student.sust.edu';

// Only `active` can log in; every other state is explained by the server.
const STATUS_TONE = {
  active: 'ann-badge-ok',
  pending: 'ann-badge-wait',
  pending_verification: 'ann-badge-wait',
  rejected: 'ann-badge-stop',
};

function AwaitingApproval() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null);      // { status, message }

  // Email swap (the fastest route out of `pending` — no admin needed).
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [swapSent, setSwapSent] = useState(false);
  const [swapCode, setSwapCode] = useState('');
  const [swapping, setSwapping] = useState(false);

  const checkStatus = useCallback(async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setChecking(true);
    try {
      const res = await fetch(
        `${API_URL}/api/auth/status?email=${encodeURIComponent(email.trim())}`
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ status: data.status, message: data.message });
      } else {
        setStatus(null);
        showToast(data.error || 'No account found with this email.', 'error');
      }
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
    } finally {
      setChecking(false);
    }
  }, [email, showToast]);

  const requestSwap = async (e) => {
    e.preventDefault();
    if (!newEmail.trim().toLowerCase().endsWith(SUST_DOMAIN)) {
      showToast(`Your new address must end in ${SUST_DOMAIN}.`, 'error');
      return;
    }
    setSwapping(true);
    try {
      // Authenticated by password, not a token — pending users have none.
      const res = await fetch(`${API_URL}/api/auth/change-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_email: email.trim(),
          password,
          new_email: newEmail.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSwapSent(true);
        showToast(data.message || 'Code sent to your university address.', 'success');
      } else {
        showToast(data.error || 'Could not start the email change.', 'error');
      }
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
    } finally {
      setSwapping(false);
    }
  };

  const confirmSwap = async (e) => {
    e.preventDefault();
    setSwapping(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_email: newEmail.trim(), code: swapCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.message || 'Your account is now active — you can log in.', 'success');
        navigate('/auth', { replace: true });
      } else {
        showToast(data.error || 'That code was not accepted.', 'error');
        setSwapCode('');
      }
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="login-container">
        <div className="login-card manual-verification-card">
          <div className="login-header">
            <h1>Account Status</h1>
            <p>Check where your registration stands, or move onto your university address.</p>
          </div>

          <form onSubmit={checkStatus} className="login-form">
            <div className="form-group">
              <label htmlFor="ap-email">Your registered email</label>
              <input
                type="email"
                id="ap-email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={checking}>
              {checking ? 'Checking…' : 'Check status'}
            </button>
          </form>

          {status && (
            <div className="status-panel">
              <span className={`ann-badge ${STATUS_TONE[status.status] || ''}`}>
                {String(status.status || 'unknown').replace(/_/g, ' ')}
              </span>
              <p className="status-message">{status.message}</p>
            </div>
          )}

          {/* The email swap skips admin review entirely, so it is offered as
              soon as we know the account is waiting. */}
          {status && status.status !== 'active' && (
            <div className="swap-section">
              <h2 className="swap-heading">Got your university address?</h2>
              <p className="swap-note">
                Moving onto an <code>{SUST_DOMAIN}</code> address activates your account
                immediately — no admin approval needed, and your ID card is deleted.
              </p>

              {!swapSent ? (
                <form onSubmit={requestSwap} className="login-form">
                  <div className="form-group password-group">
                    <label htmlFor="ap-password">Your password</label>
                    <input
                      type="password"
                      id="ap-password"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ap-new-email">New university email</label>
                    <input
                      type="email"
                      id="ap-new-email"
                      className="form-input"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={`2021331000${SUST_DOMAIN}`}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn" disabled={swapping}>
                    {swapping ? 'Sending…' : 'Send verification code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={confirmSwap} className="login-form">
                  <p className="swap-note">
                    We sent a code to <strong>{newEmail}</strong>. Enter it below.
                  </p>
                  <div className="form-group">
                    <label htmlFor="ap-swap-code">Verification code</label>
                    <input
                      type="text"
                      id="ap-swap-code"
                      className="form-input"
                      value={swapCode}
                      onChange={(e) => setSwapCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn" disabled={swapping}>
                    {swapping ? 'Verifying…' : 'Confirm new address'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <a href="#" className="forgot-password-link" onClick={(e) => { e.preventDefault(); setSwapSent(false); setSwapCode(''); }}>
                      Use a different address
                    </a>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="login-footer">
            <p>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth'); }}>
                Back to Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AwaitingApproval;
