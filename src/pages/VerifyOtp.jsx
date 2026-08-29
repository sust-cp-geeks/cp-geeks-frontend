import { API_URL } from '../api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Auth.css';

// Backend allows 5 OTP emails per address per hour, so the resend button is
// gated behind a cooldown rather than left free to burn that budget.
const RESEND_COOLDOWN_SECONDS = 60;

function VerifyOtp() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [searchParams] = useSearchParams();

  // Registration passes the address through the URL; typing it is the fallback
  // for anyone who lands here directly or reopens the link later.
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [approvalMessage, setApprovalMessage] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // "active" can log in now; "pending" still needs an admin to approve.
        if (data.status === 'pending') {
          setApprovalMessage(data.message || 'Email verified — your account is pending admin approval.');
          showToast(data.message || 'Email verified — awaiting admin approval.', 'success');
        } else {
          showToast(data.message || 'Email verified — you can now log in.', 'success');
          navigate('/auth', { replace: true });
        }
      } else {
        // Five wrong entries also invalidate the live code, so say that plainly.
        showToast(data.error || data.message || 'Verification failed.', 'error');
        setCode('');
      }
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showToast(data.message || 'A new code is on its way.', 'success');
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        showToast(data.error || data.message || 'Could not send a new code.', 'error');
      }
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="login-container">
        <div className="login-card manual-verification-card">
          <div className="login-header">
            <h1>Verify Your Email</h1>
            <p>
              {approvalMessage
                ? 'Your email address is confirmed.'
                : 'Enter the 6-digit code we sent to your email address.'}
            </p>
          </div>

          {approvalMessage ? (
            <>
              <div className="manual-signup-banner">
                <span>{approvalMessage}</span>
              </div>
              <div className="login-footer">
                <p>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); navigate(`/auth/pending?email=${encodeURIComponent(email)}`); }}
                  >
                    Track your approval, or switch to a university email
                  </a>
                </p>
                <p>
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth'); }}>
                    Back to Sign in
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleVerifySubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="otp-email">Email address</label>
                  <input
                    type="email"
                    id="otp-email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="otp-code">Verification Code</label>
                  <input
                    type="text"
                    id="otp-code"
                    className="form-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={submitting} style={{ marginTop: '1.5rem' }}>
                  {submitting ? 'Verifying…' : 'Verify Email'}
                </button>
              </form>

              <div className="auth-links-below-btn">
                <p className="auth-link-line">
                  Didn't get the code?{' '}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleResend(); }}
                    style={cooldown > 0 || resending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
                  >
                    {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </a>
                </p>
                <p className="auth-link-line">
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth'); }}>
                    Back to Sign in
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
