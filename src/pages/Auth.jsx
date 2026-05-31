import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [codeforcesHandle, setCodeforcesHandle] = useState('');
  const [role, setRole] = useState('student');

  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Send network request to the backend
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Only sending email and password as per the backend spec
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        
        // Save the authentication token (if backend uses JWT)
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        const userRole = data.user?.is_admin ? 'admin' : (data.user?.is_manager ? 'manager' : 'student');
        localStorage.setItem('role', userRole);
        
        // Redirect the user
        navigate('/news');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Login failed: ${errorData.error || errorData.message || 'Invalid credentials'}`);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Could not connect to the server.");
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Send register request to the backend
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Mapping regNumber to reg_number as expected by Rust backend
        body: JSON.stringify({ reg_number: regNumber, name, email, password, codeforces_handle: codeforcesHandle }),
      });

      if (response.ok) {
        alert('Registration successful! Please log in.');
        toggleMode(); // Switch to login view
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Registration failed: ${errorData.error || errorData.message || 'Something went wrong'}`);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Could not connect to the server.");
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Clear form fields when switching modes
    setEmail('');
    setPassword('');
    setName('');
    setRegNumber('');
    setCodeforcesHandle('');
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
        <div className="login-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Please enter your details to sign in.' : 'Join us for the CPGeeks contests.'}</p>
        </div>
        
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <input 
                type="email" 
                id="login-email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required 
              />
            </div>
            
            <div className="form-group password-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="login-password"
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
            

            
            <button type="submit" className="submit-btn" style={{marginTop: '1.5rem'}}>
              Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="signup-name">Full Name</label>
              <input 
                type="text" 
                id="signup-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-reg">Registration Number</label>
              <input 
                type="text" 
                id="signup-reg"
                className="form-input"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="2019331000"
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Student Email</label>
              <input 
                type="email" 
                id="signup-email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@sust.edu"
                required 
              />
            </div>
            
            <div className="form-group password-group">
              <label htmlFor="signup-password">Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="signup-password"
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
              <label htmlFor="signup-cf">Codeforces Handle (Optional)</label>
              <input 
                type="text" 
                id="signup-cf"
                className="form-input"
                value={codeforcesHandle}
                onChange={(e) => setCodeforcesHandle(e.target.value)}
                placeholder="tourist"
              />
            </div>
            
            <button type="submit" className="submit-btn" style={{marginTop: '1.5rem'}}>
              Sign Up
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }}>
              {isLogin ? "Sign up" : "Sign in"}
            </a>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
