import { API_URL } from '../api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Auth.css';

const SUST_DOMAIN = '@student.sust.edu';

function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  // Derive view from URL so browser back/forward works correctly
  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgotPassword = mode === 'forgot';
  const isResetPassword = mode === 'reset';

  const [resetName, setResetName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Forgot-password shares the OTP email budget: 5 per address per hour.
  const [resetCooldown, setResetCooldown] = useState(0);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [codeforcesHandle, setCodeforcesHandle] = useState('');
  const [vjudgeHandle, setVjudgeHandle] = useState('');
  const [atcoderHandle, setAtcoderHandle] = useState('');

  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setTimeout(() => setResetCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetCooldown]);

  // Checked as the user types so the door switch is visible before submitting.
  const isSustEmail = email.trim().toLowerCase().endsWith(SUST_DOMAIN);

  const clearFields = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRegNumber('');
    setCodeforcesHandle('');
    setVjudgeHandle('');
    setResetCode('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.token) localStorage.setItem('token', data.token);
        const userRole = data.user?.is_admin ? 'admin' : (data.user?.is_manager ? 'manager' : 'student');
        localStorage.setItem('role', userRole);
        showToast('Login successful!', 'success');
        navigate('/announcements');
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(`Login failed: ${errorData.error || errorData.message || 'Invalid credentials'}`, 'error');
      }
    } catch (err) {
      console.error("Network error:", err);
      showToast("Could not connect to the server.", 'error');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    // Only a university address may register as plain JSON; anything else needs
    // the ID card upload door, so send them there instead of earning a 400.
    if (!isSustEmail) {
      showToast('That address needs ID card verification — continuing to manual sign up.', 'info');
      navigate('/auth/manual-signup');
      return;
    }
    setSubmitting(true);
    try {
      // Empty optional handles are omitted; the API validates them when present.
      const payload = { reg_number: regNumber, name, email, password };
      if (codeforcesHandle.trim()) payload.codeforces_handle = codeforcesHandle.trim();
      if (vjudgeHandle.trim()) payload.vjudge_handle = vjudgeHandle.trim();
      if (atcoderHandle.trim()) payload.atcoder_handle = atcoderHandle.trim();

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        // Registration lands on pending_verification — the OTP screen is next.
        showToast('Account created — check your email for the verification code.', 'success');
        const registeredEmail = email;
        clearFields();
        navigate(`/auth/verify?email=${encodeURIComponent(registeredEmail)}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(`Registration failed: ${errorData.error || errorData.message || 'Something went wrong'}`, 'error');
      }
    } catch (err) {
      console.error("Network error:", err);
      showToast("Could not connect to the server.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (resetCooldown > 0) return;
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        setResetName(data.name || 'User');
        setResetCooldown(60);
        showToast(data.message || 'Password reset code sent!', 'success');
        // Push reset mode so back goes to forgot
        setSearchParams({ mode: 'reset' });
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(`Forgot password failed: ${errorData.error || errorData.message || 'Error'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("Could not connect to the server.", 'error');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, new_password: password }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.message || 'Password reset successfully!', 'success');
        setPassword('');
        setResetCode('');
        // Go back to login, replacing so they don't land on reset again
        setSearchParams({}, { replace: true });
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(`Reset password failed: ${errorData.error || errorData.message || 'Error'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("Could not connect to the server.", 'error');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-layout-container">
        <div className="hero-side">
          <h1>
            {isForgotPassword ? 'Password Recovery.' :
             isResetPassword ? 'Reset Phrase.' :
             isSignup ? 'Begin Journey.' : 'Welcome Back.'}
          </h1>
          {(isForgotPassword || isResetPassword) && (
            <p>
              {isForgotPassword ? 'Enter your registered email identification to receive reset instructions.' :
               `Hello ${resetName}, specify your new secret phrase and verification code.`}
            </p>
          )}
          {(isLogin || isSignup) && (
            <p>
              {isSignup
                ? 'Join the SUST competitive programming community — contests, practice archives, and leaderboards.'
                : 'Sign in to access announcements, contests, and your competitive programming profile.'}
            </p>
          )}
        </div>
        <div className="form-side">
          <div className="login-card">
            {!isForgotPassword && !isResetPassword && (
              <div className="auth-toggle-wrapper">
                <div className="auth-toggle-container">
                  <button
                    type="button"
                    className={`auth-toggle-btn ${isLogin ? 'active' : ''}`}
                    onClick={() => { clearFields(); setSearchParams({ mode: 'login' }); }}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    className={`auth-toggle-btn ${isSignup ? 'active' : ''}`}
                    onClick={() => { clearFields(); setSearchParams({ mode: 'signup' }); }}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            <div className="login-header">
              <h2>
                {isForgotPassword ? 'Forgot Password' :
                 isResetPassword ? 'Reset Password' :
                 isSignup ? 'Create Profile' : 'Member Credentials'}
              </h2>
            </div>

          {/* ── Forgot Password ── */}
          {isForgotPassword && (
            <form onSubmit={handleForgotPasswordSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="forgot-email">Email address</label>
                <input
                  type="email" id="forgot-email" className="form-input"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={resetCooldown > 0} style={{ marginTop: '1.5rem' }}>
                {resetCooldown > 0 ? `Resend in ${resetCooldown}s` : 'Send Reset Code'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <a href="#" className="forgot-password-link" onClick={(e) => { e.preventDefault(); setSearchParams({}, { replace: false }); }}>
                  Back to Login
                </a>
              </div>
            </form>
          )}

          {/* ── Reset Password ── */}
          {isResetPassword && (
            <form onSubmit={handleResetPasswordSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="reset-code">Reset Code</label>
                <input
                  type="text" id="reset-code" className="form-input"
                  value={resetCode} onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-digit code" required
                />
              </div>
              <div className="form-group password-group">
                <label htmlFor="reset-password">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"} id="reset-password" className="form-input"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button type="submit" className="submit-btn" style={{ marginTop: '1.5rem' }}>
                Reset Password
              </button>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <a href="#" className="forgot-password-link" onClick={(e) => { e.preventDefault(); setSearchParams({}, { replace: false }); }}>
                  Back to Login
                </a>
              </div>
            </form>
          )}

          {/* ── Login ── */}
          {isLogin && (
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="login-email">Email address</label>
                <input
                  type="email" id="login-email" className="form-input"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" required
                />
              </div>
              <div className="form-group password-group">
                <label htmlFor="login-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"} id="login-password" className="form-input"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" style={{ marginTop: '0.5rem' }}>
                Sign In
              </button>

              <div className="auth-links-below-btn">
                <p className="auth-link-line">
                  Don't have a student Gmail?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth/manual-signup'); }}>Click Here</a>
                </p>
                <p className="auth-link-line">
                  <a href="#" onClick={(e) => { e.preventDefault(); setSearchParams({ mode: 'forgot' }); }}>Forgot Password?</a>
                </p>
                <p className="auth-link-line">
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); navigate(`/auth/pending${email ? `?email=${encodeURIComponent(email)}` : ''}`); }}
                  >
                    Waiting for approval?
                  </a>
                </p>
              </div>
            </form>
          )}

          {/* ── Sign Up ── */}
          {isSignup && (
            <form onSubmit={handleSignupSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="signup-name">Full Name</label>
                <input type="text" id="signup-name" className="form-input"
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-reg">Registration Number</label>
                <input type="text" id="signup-reg" className="form-input"
                  value={regNumber} onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="2019331000" required />
              </div>

              <div className="manual-signup-banner">
                <span>
                  {email && !isSustEmail
                    ? 'That is not a student email — it needs ID card verification, so please '
                    : "If you don't have active student email please "}
                </span>
                <button
                  type="button"
                  className="manual-signup-link-btn"
                  onClick={() => navigate('/auth/manual-signup')}
                >
                  sign up here manually
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="signup-email">Student Email</label>
                <input type="email" id="signup-email" className="form-input"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@sust.edu" required />
              </div>
              <div className="form-group password-group">
                <label htmlFor="signup-password">Password</label>
                <div className="password-input-wrapper">
                  <input type={showPassword ? "text" : "password"} id="signup-password" className="form-input"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="signup-cf">Codeforces Handle (Optional)</label>
                <input type="text" id="signup-cf" className="form-input"
                  value={codeforcesHandle} onChange={(e) => setCodeforcesHandle(e.target.value)}
                  maxLength={50}
                  placeholder="tourist" />
              </div>
              <div className="form-group">
                <label htmlFor="signup-vj">VJudge Handle (Optional)</label>
                <input type="text" id="signup-vj" className="form-input"
                  value={vjudgeHandle} onChange={(e) => setVjudgeHandle(e.target.value)}
                  maxLength={100}
                  placeholder="vjudge_handle" />
                <p className="auth-field-hint">
                  Used to match you to VJudge standings — without it you show as “unregistered”.
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="signup-at">AtCoder Handle (Optional)</label>
                <input type="text" id="signup-at" className="form-input"
                  value={atcoderHandle} onChange={(e) => setAtcoderHandle(e.target.value)}
                  maxLength={100}
                  placeholder="atcoder_handle" />
                <p className="auth-field-hint">
                  Checked against AtCoder when you sign up. Your rating and contest
                  history appear on the AtCoder page.
                </p>
              </div>
              <button type="submit" className="submit-btn" disabled={submitting} style={{ marginTop: '1.5rem' }}>
                {submitting ? 'Creating account…' : 'Sign Up'}
              </button>

              <div className="auth-links-below-btn">
                <p className="auth-link-line">
                  Don't have a student Gmail?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth/manual-signup'); }}>Click Here</a>
                </p>
              </div>
            </form>
          )}

          {/* ── Footer only for login view (now embedded above for signup) ── */}
        </div>
      </div>
    </div>
  </div>
);
}

export default Auth;
