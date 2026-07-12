import { API_URL } from '../api';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Auth.css';

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

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [codeforcesHandle, setCodeforcesHandle] = useState('');
  const [vjudgeHandle, setVjudgeHandle] = useState('');

  const navigate = useNavigate();
  const showToast = useToast();

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
        navigate('/news');
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
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg_number: regNumber, name, email, password, codeforces_handle: codeforcesHandle }),
      });
      if (response.ok) {
        showToast('Registration successful! Please log in.', 'success');
        clearFields();
        setSearchParams({}, { replace: true });
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(`Registration failed: ${errorData.error || errorData.message || 'Something went wrong'}`, 'error');
      }
    } catch (err) {
      console.error("Network error:", err);
      showToast("Could not connect to the server.", 'error');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        setResetName(data.name || 'User');
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
      <div className="auth-background-effects">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>
      <div className="login-container">
        <div className="login-card">
          {!isForgotPassword && !isResetPassword && (
            <div className="auth-toggle-wrapper">
              <div className="auth-toggle-container">
                <button
                  type="button"
                  className={`auth-toggle-btn ${isLogin ? 'active' : ''}`}
                  onClick={() => { clearFields(); setSearchParams({ mode: 'login' }); }}
                >
                  Login
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
            <h1>
              {isForgotPassword ? 'Forgot Password' :
               isResetPassword ? 'Reset Password' :
               isSignup ? 'Create your new profile' : 'Log in to your existing profile'}
            </h1>
            <p>
              {isForgotPassword ? 'Enter your email to receive a reset code.' :
               isResetPassword ? `Hello ${resetName}, enter your new password and the code sent to your email.` :
               isSignup ? 'Join us for the CPGeeks contests.' : 'Please enter your credentials to get started.'}
            </p>
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
              <button type="submit" className="submit-btn" style={{ marginTop: '1.5rem' }}>
                Send Reset Code
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
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth/manual-verification'); }}>Click Here</a>
                </p>
                <p className="auth-link-line">
                  <a href="#" onClick={(e) => { e.preventDefault(); setSearchParams({ mode: 'forgot' }); }}>Forgot Password?</a>
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
                  placeholder="tourist" />
              </div>
              <div className="form-group">
                <label htmlFor="signup-vj">VJudge Handle (Optional)</label>
                <input type="text" id="signup-vj" className="form-input"
                  value={vjudgeHandle} onChange={(e) => setVjudgeHandle(e.target.value)}
                  placeholder="vjudge_handle" />
              </div>
              <button type="submit" className="submit-btn" style={{ marginTop: '1.5rem' }}>
                Sign Up
              </button>

              <div className="auth-links-below-btn">
                <p className="auth-link-line">
                  Don't have a student Gmail?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth/manual-verification'); }}>Click Here</a>
                </p>
              </div>
            </form>
          )}

          {/* ── Footer only for login view (now embedded above for signup) ── */}
        </div>
      </div>
    </div>
  );
}

export default Auth;
