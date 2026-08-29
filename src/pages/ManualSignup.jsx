import { API_URL } from '../api';
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Auth.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // backend rejects anything larger
const SUST_DOMAIN = '@student.sust.edu';

// One dropzone. This door needs two of them (front + back), so the markup
// lives here once rather than twice inside the form.
function IdCardDropzone({ id, label, hint, file, preview, onFile, onRemove }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onFile(e.dataTransfer.files?.[0]);
  };

  const clear = () => {
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div
        className={`upload-dropzone ${isDragging ? 'dropzone-active' : ''} ${preview ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !preview && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) => onFile(e.target.files?.[0])}
          style={{ display: 'none' }}
        />

        {preview ? (
          <div className="upload-preview">
            <img src={preview} alt={`${label} preview`} />
            <div className="preview-overlay">
              <span className="preview-filename">{file?.name}</span>
              <button
                type="button"
                className="remove-file-btn"
                onClick={(e) => { e.stopPropagation(); clear(); }}
              >
                ✕ Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="upload-text">{hint}</p>
            <p className="upload-subtext">or click to browse</p>
            <p className="upload-formats">JPG, PNG, WebP · max 5 MB</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ManualSignup() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codeforcesHandle, setCodeforcesHandle] = useState('');
  const [vjudgeHandle, setVjudgeHandle] = useState('');

  const [front, setFront] = useState({ file: null, preview: null });
  const [back, setBack] = useState({ file: null, preview: null });
  const [submitting, setSubmitting] = useState(false);

  // Curried so both dropzones share one validation path.
  const acceptFile = useCallback((setSide) => (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast('Please upload a JPG, PNG, or WebP image.', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('That image is larger than 5 MB — please use a smaller file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setSide({ file, preview: reader.result });
    reader.readAsDataURL(file);
  }, [showToast]);

  const clearSide = (setSide) => () => setSide({ file: null, preview: null });

  // A university address doesn't need this door at all — it skips admin review.
  const looksLikeSustEmail = email.trim().toLowerCase().endsWith(SUST_DOMAIN);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!front.file || !back.file) {
      showToast('Both sides of your ID card are required.', 'error');
      return;
    }
    setSubmitting(true);

    try {
      const body = new FormData();
      body.append('reg_number', regNumber);
      body.append('name', name);
      body.append('email', email);
      body.append('password', password);
      if (codeforcesHandle.trim()) body.append('codeforces_handle', codeforcesHandle.trim());
      if (vjudgeHandle.trim()) body.append('vjudge_handle', vjudgeHandle.trim());
      body.append('id_card_front', front.file);
      body.append('id_card_back', back.file);

      // No Content-Type header — the browser sets the multipart boundary itself.
      const response = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', body });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showToast('Account created — check your email for the verification code.', 'success');
        navigate(`/auth/verify?email=${encodeURIComponent(email)}`);
      } else {
        showToast(data.error || data.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      console.error('Network error:', err);
      showToast('Could not connect to the server.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="login-container">
        <div className="login-card manual-verification-card">
          <div className="login-header">
            <h1>Manual Student Sign Up</h1>
            <p>For students without an active SUST student email. Upload both sides of your ID card for admin review.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="ms-name">Full Name</label>
              <input
                type="text"
                id="ms-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ms-reg">Registration Number</label>
              <input
                type="text"
                id="ms-reg"
                className="form-input"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="2021331000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ms-email">Personal / Alternate Email</label>
              <input
                type="email"
                id="ms-email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                required
              />
            </div>

            {looksLikeSustEmail && (
              <div className="manual-signup-banner">
                <span>That's a university address — you can </span>
                <button
                  type="button"
                  className="manual-signup-link-btn"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  sign up directly
                </button>
                <span> without ID card review.</span>
              </div>
            )}

            <div className="form-group password-group">
              <label htmlFor="ms-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="ms-password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ms-cf">Codeforces Handle (Optional)</label>
              <input
                type="text"
                id="ms-cf"
                className="form-input"
                value={codeforcesHandle}
                onChange={(e) => setCodeforcesHandle(e.target.value)}
                placeholder="tourist"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ms-vj">VJudge Handle (Optional)</label>
              <input
                type="text"
                id="ms-vj"
                className="form-input"
                value={vjudgeHandle}
                onChange={(e) => setVjudgeHandle(e.target.value)}
                placeholder="vjudge_handle"
              />
            </div>
            <p className="upload-subtext" style={{ marginTop: '-0.75rem' }}>
              Used to match you to VJudge standings — without it you show as “unregistered”.
            </p>

            <IdCardDropzone
              id="ms-id-front"
              label="Student ID Card — Front"
              hint="Drag & drop the front here"
              file={front.file}
              preview={front.preview}
              onFile={acceptFile(setFront)}
              onRemove={clearSide(setFront)}
            />

            <IdCardDropzone
              id="ms-id-back"
              label="Student ID Card — Back"
              hint="Drag & drop the back here"
              file={back.file}
              preview={back.preview}
              onFile={acceptFile(setBack)}
              onRemove={clearSide(setBack)}
            />

            <button type="submit" className="submit-btn" disabled={submitting} style={{ marginTop: '0.5rem' }}>
              {submitting ? 'Submitting — this can take a few seconds…' : 'Submit Manual Sign Up'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Already verified or have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/auth'); }}>
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManualSignup;
