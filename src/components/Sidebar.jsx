import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export default function Sidebar({ 
  user, 
  credits, // 👈 Receiving credits from App.jsx
  activeTab, 
  setActiveTab, 
  activeCategory, 
  loadCollection, 
  handleLogout, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}) {
  
  const [showMenu, setShowMenu] = useState(false);

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert(`✅ Password reset email sent to ${user.email}. Check your inbox!`);
      setShowMenu(false);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon">💎</div>
        <div className="logo-text">Lumière <span className="gold-text">Atelier</span></div>
        <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
      </div>

      <nav className="sidebar-nav">
        <button className={`nav-item ${activeTab === 'create' ? 'active' : ''}`} onClick={() => {setActiveTab('create'); setMobileMenuOpen(false);}}>
          <span className="icon">✨</span> Create Design
        </button>
        <button className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => {setActiveTab('gallery'); setMobileMenuOpen(false);}}>
          <span className="icon">🖼️</span> My Gallery
        </button>
        
        <div className="nav-divider"></div>
        <div className="nav-label">Collections</div>
        <button className={`nav-item-sub ${activeCategory === 'rings' && activeTab === 'collections' ? 'active' : ''}`} onClick={() => loadCollection('rings')}>Engagement Rings</button>
        <button className={`nav-item-sub ${activeCategory === 'necklaces' && activeTab === 'collections' ? 'active' : ''}`} onClick={() => loadCollection('necklaces')}>Necklaces</button>
      </nav>

      {/* --- USER PROFILE --- */}
      <div className="user-profile" onClick={() => setShowMenu(!showMenu)}>
        
        {showMenu && (
          <div className="profile-menu">
            <button onClick={(e) => { e.stopPropagation(); handleChangePassword(); }}>
              🔑 Change Password
            </button>
            <button className="danger" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
              🚪 Logout
            </button>
          </div>
        )}

        <div className="avatar">{user.email ? user.email[0].toUpperCase() : 'U'}</div>
        <div className="user-info">
          <span className="name">{user.email.split('@')[0]}</span>
          {/* 👇 CREDIT DISPLAY HERE */}
          <span className="plan" style={{color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem'}}>
             💎 {credits !== undefined ? credits : '-'} Credits
          </span>
        </div>
        
        <div style={{marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.5}}>▲</div>
      </div>
    </aside>
  );
}