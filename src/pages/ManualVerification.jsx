import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function ManualVerification() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Please upload a JPG, JPEG, or PNG image.');
      return;
    }
    setIdCardFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setIdCardPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

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
    if (!idCardFile) {
      alert('Please upload your Student ID card photo.');
      return;
    }
    setSubmitting(true);

    // TODO: integrate with actual backend endpoint for manual verification
    // For now, simulate a submission
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert('Your manual verification request has been submitted. An administrator will review your credentials.');
      navigate('/auth');
    } catch (err) {
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
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
        <div className="login-card manual-verification-card">
          <div className="login-header">
            <h1>Manual Verification</h1>
            <p>Submit your credentials for admin approval.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="mv-name">Full Name</label>
              <input
                type="text"
                id="mv-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mv-reg">Registration Number</label>
              <input
                type="text"
                id="mv-reg"
                className="form-input"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="2019331000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mv-email">Personal Email Address</label>
              <input
                type="email"
                id="mv-email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Student ID Card Photo</label>
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
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </form>

          <div className="discord-notice">
            <div className="discord-notice-text">
              <p className="discord-notice-title">Don't have a Student ID card yet?</p>
              <p className="discord-notice-desc">Join our Discord community and contact an administrator for manual verification.</p>
            </div>
            <a
              href="https://discord.gg/placeholder-invite"
              target="_blank"
              rel="noopener noreferrer"
              className="discord-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </a>
          </div>

          <div className="login-footer">
            <p>
              Already have an account?{' '}
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

export default ManualVerification;
