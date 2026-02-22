import { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import './App.css';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Access denied. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="auth-bg-shapes"></div>
        <div className="auth-bg-gradient"></div>
      </div>

      {/* Login Card */}
      <div className="auth-card-wrapper">
        <div className="auth-card-modern">
          
          {/* Logo & Brand */}
          <div className="auth-brand">
            <div className="auth-logo-ring"></div>
            <h1 className="auth-title">Jewel <span className="gold-text">AI</span></h1>
            <p className="auth-subtitle">AI-Powered Jewelry Design Studio</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form-modern">
            
            {error && (
              <div className="auth-error">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group-modern">
              <label className="form-label-modern">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input
                  type="email"
                  className="input-modern"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder=""
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label className="form-label-modern">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-modern"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder=""
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-login-modern" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Enter Studio</span>
                  <span className="arrow-icon">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer-modern">
            <p>🔐 Secured by Firebase Authentication</p>
          </div>
        </div>
      </div>
    </div>
  );
}
