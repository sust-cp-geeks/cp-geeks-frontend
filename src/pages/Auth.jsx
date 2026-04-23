import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [role, setRole] = useState('student');

  const navigate = useNavigate();

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt with:', { email, password, role });
    alert(`Logged in as ${email} with role ${role}`);
    localStorage.setItem('role', role);
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/news');
    }
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    console.log('Signup attempt with:', { name, regNumber, email, password });
    alert(`Registered ${name} (${regNumber}) with email ${email}`);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Clear form fields when switching modes
    setEmail('');
    setPassword('');
    setName('');
    setRegNumber('');
  };

  return (
    <div className="auth-page-wrapper">
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
            
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input 
                type="password" 
                id="login-password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="login-role">Role</label>
              <select id="login-role" className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="student">Student</option>
              </select>
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
            
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input 
                type="password" 
                id="signup-password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="signup-role">Role</label>
              <select id="signup-role" className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="student">Student</option>
              </select>
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
