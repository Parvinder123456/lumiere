import React, { useState, useEffect } from 'react';

// Cache to store data so we don't fetch twice
const reelCache = { rings: null, necklaces: null };

export default function QuickPickReel({ API_BASE_URL, onSelectTemplate }) {
  const [isReelOpen, setIsReelOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [reelCategory, setReelCategory] = useState('rings');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Pre-fetch data immediately
  useEffect(() => {
    const preFetch = async () => {
      if (!reelCache.rings) fetch(`${API_BASE_URL}/collections?category=rings`).then(r=>r.json()).then(d => reelCache.rings = d).catch(console.error);
      if (!reelCache.necklaces) fetch(`${API_BASE_URL}/collections?category=necklaces`).then(r=>r.json()).then(d => reelCache.necklaces = d).catch(console.error);
    };
    preFetch();
  }, [API_BASE_URL]);

  const toggleFab = () => setIsFabMenuOpen(!isFabMenuOpen);

  const openReel = async (category) => {
    setIsFabMenuOpen(false);
    setReelCategory(category);
    setIsReelOpen(true);

    // 2. Use Cache if possible
    if (reelCache[category]) {
      setItems(reelCache[category]);
    } else {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/collections?category=${category}`);
        if(res.ok) {
          const data = await res.json();
          reelCache[category] = data;
          setItems(data);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleItemClick = (url, name) => {
    setIsReelOpen(false);
    onSelectTemplate(url, name);
  };

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
                  <span style={{color: '#1e293b'}}>Quick Pick: {reelCategory}</span>
                  <button className="reel-close" onClick={() => setIsReelOpen(false)}>✕</button>
              </div>
              <div className="reel-scroll-area">
                  {loading ? (
                      <div className="spinner-ring" style={{borderColor: '#ccc', borderLeftColor: '#f59e0b'}}></div>
                  ) : items.length === 0 ? (
                      <div style={{color:'#64748b', margin:'auto'}}>No items found</div>
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