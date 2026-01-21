import { useState } from 'react';
import { auth } from './firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import './App.css'; // Uses your Light Theme

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🔒 STRICT LOGIN ONLY (No Signup)
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setError("Access Denied. Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-icon">💎</div>
          <div className="logo-text">Lumière <span className="gold-text">Atelier</span></div>
          <p className="sub-text" style={{marginTop: '10px', color: '#64748b'}}>
            Restricted Access Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-banner">{error}</div>}
          
          <div className="form-group">
            <label className="nav-label">Access ID</label>
            <input 
              type="email" 
              className="select-input" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="authorized@lumiere.com"
            />
          </div>

          <div className="form-group">
            <label className="nav-label">Passcode</label>
            <input 
              type="password" 
              className="select-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Verifying...' : 'Enter Studio'}
          </button>
        </form>

        <div className="auth-footer" style={{marginTop: '2rem'}}>
          <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>
            Authorized Personnel Only. Contact Admin for access.
          </p>
        </div>
      </div>
    </div>
  );
}