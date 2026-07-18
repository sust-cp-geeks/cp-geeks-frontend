import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Auth.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

function ManualSignup() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [name, setName] = useState('');
  const [batch, setBatch] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codeforcesHandle, setCodeforcesHandle] = useState('');
  const [vjudgeHandle, setVjudgeHandle] = useState('');
  
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast('Please upload a JPG, JPEG, or PNG image.', 'error');
      return;
    }
    setIdCardFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setIdCardPreview(reader.result);
    reader.readAsDataURL(file);
  }, [showToast]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const removeFile = () => {
    setIdCardFile(null);
    setIdCardPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showToast('Manual signup request submitted! An administrator will review your batch & credentials.', 'success');
      navigate('/auth');
    } catch (err) {
      console.error(err);
      showToast('Submission failed. Please try again.', 'error');
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
            <p>For students without an active SUST student email. Submit your batch & details for manual verification.</p>
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
              <label htmlFor="ms-batch">Batch / Academic Session</label>
              <input
                type="text"
                id="ms-batch"
                className="form-input"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. 2021 or 2021-22"
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

            <div className="form-group">
              <label>Student ID Card Photo (Optional Proof)</label>
              <div
                className={`upload-dropzone ${isDragging ? 'dropzone-active' : ''} ${idCardPreview ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !idCardPreview && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />

                {idCardPreview ? (
                  <div className="upload-preview">
                    <img src={idCardPreview} alt="ID Card Preview" />
                    <div className="preview-overlay">
                      <span className="preview-filename">{idCardFile?.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
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
                    <p className="upload-text">Drag & drop your ID card here</p>
                    <p className="upload-subtext">or click to browse</p>
                    <p className="upload-formats">JPG, JPEG, PNG</p>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={submitting} style={{ marginTop: '0.5rem' }}>
              {submitting ? 'Submitting...' : 'Submit Manual Sign Up'}
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
