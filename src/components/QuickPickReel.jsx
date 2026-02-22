import React, { useState, useEffect } from 'react';

// 🧠 IQ 500 Move: Keep cache LOCAL to this file. 
// Since App.jsx forces a page reload on Logout, this cache is automatically cleared.
// No need for external files. Secure by design.
const localReelCache = { rings: null, necklaces: null };

export default function QuickPickReel({ API_BASE_URL, onSelectTemplate, user }) { // 👈 1. Receive User
  const [isReelOpen, setIsReelOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [reelCategory, setReelCategory] = useState('rings');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleFab = () => setIsFabMenuOpen(!isFabMenuOpen);

  const openReel = async (category) => {
    setIsFabMenuOpen(false);
    setReelCategory(category);
    setIsReelOpen(true);

    // 2. Check Cache
    if (localReelCache[category]) {
      setItems(localReelCache[category]);
      return;
    }

    // 3. Fetch Securely
    if (!user) {
        console.warn("User not authenticated for QuickPick");
        return;
    }

    setLoading(true);
    try {
        const token = await user.getIdToken(); // 👈 4. Get Token
        const res = await fetch(`${API_BASE_URL}/collections?category=${category}`, {
            headers: { 'Authorization': `Bearer ${token}` } // 👈 5. Send Token
        });
        
        if(res.ok) {
            const data = await res.json();
            localReelCache[category] = data; // Cache it
            setItems(data);
        } else {
            console.error("QuickPick Fetch Failed:", res.status);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleItemClick = (url, name) => {
    setIsReelOpen(false);
    onSelectTemplate(url, name);
  };

  // If user isn't logged in, hide the button entirely
  if (!user) return null;

  return (
    <>
      {!isReelOpen && (
        <div className="fab-container">
            {isFabMenuOpen && (
                <div className="fab-menu">
                    <button onClick={() => openReel('rings')}>💍 Rings</button>
                    <button onClick={() => openReel('necklaces')}>📿 Necklaces</button>
                </div>
            )}
            <button className="fab-btn" onClick={toggleFab}>🎨</button>
        </div>
      )}

      {isReelOpen && (
          <div className="reel-overlay">
              <div className="reel-header">
                  <span style={{color: '#1e293b'}}>Your {reelCategory}</span>
                  <button className="reel-close" onClick={() => setIsReelOpen(false)}>✕</button>
              </div>
              <div className="reel-scroll-area">
                  {loading ? (
                      <div className="spinner-ring" style={{borderColor: '#ccc', borderLeftColor: '#f59e0b'}}></div>
                  ) : items.length === 0 ? (
                      <div style={{color:'#64748b', margin:'auto', textAlign:'center', padding:'20px'}}>
                          No designs found.<br/><span style={{fontSize:'0.8rem'}}>Upload to 'Collections' to see them here!</span>
                      </div>
                  ) : (
                      items.map((item, i) => (
                          <div key={i} className="reel-item" onClick={() => handleItemClick(item.url, item.name)}>
                              <img src={item.url} alt={item.name} loading="lazy" decoding="async" />
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}
    </>
  );
}