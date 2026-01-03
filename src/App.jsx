import { useState, useRef, useEffect } from 'react';
import './App.css';
import Auth from './Auth'; 
import { auth } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  // --- CONFIGURATION ---
  const API_BASE_URL = 'https://lumiere-func-linux.azurewebsites.net/api';
  
  // --- AUTH & USER STATE ---
  const [user, setUser] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('create');
  const [activeCategory, setActiveCategory] = useState('rings');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // <--- NEW STATE FOR MOBILE MENU

  // --- DATA STATE ---
  const [collectionsData, setCollectionsData] = useState([]);
  const [userGallery, setUserGallery] = useState([]);
  
  // --- CREATE STATE ---
  const [sketchFiles, setSketchFiles] = useState([]);
  const [personFile, setPersonFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [mode, setMode] = useState('product');
  
  // --- ADMIN UPLOAD STATE ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTemplateFile, setNewTemplateFile] = useState(null);
  const [newTemplateName, setNewTemplateName] = useState("");

  // Material options
  const [metalType, setMetalType] = useState('yellow-gold');
  const [gemstone, setGemstone] = useState('diamond');
  const [finish, setFinish] = useState('polished');
  const [customPrompt, setCustomPrompt] = useState('');

  // Video generation state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoStatus, setVideoStatus] = useState('idle');
  const [videoJobId, setVideoJobId] = useState(null);
  const [videoResult, setVideoResult] = useState(null);
  const [videoLogs, setVideoLogs] = useState([]);
  
  const pollIntervalRef = useRef(null);

  // --- UI OPTIONS ---
  const metalOptions = [
    { value: 'yellow-gold', label: '18K Yellow Gold', emoji: '🟡', color: '#E6C200' },
    { value: 'white-gold', label: '18K White Gold', emoji: '⚪', color: '#E8E8E8' },
    { value: 'rose-gold', label: '18K Rose Gold', emoji: '🟠', color: '#F4C2C2' },
    { value: 'platinum', label: 'Platinum 950', emoji: '⚪', color: '#E5E4E2' },
    { value: 'silver', label: 'Sterling Silver', emoji: '⚫', color: '#C0C0C0' },
    { value: 'two-tone', label: 'Two-Tone Gold', emoji: '🟡⚪', color: 'linear-gradient(45deg, #E6C200 50%, #E8E8E8 50%)' }
  ];

  const gemOptions = [
    { value: 'diamond', label: 'Diamond', emoji: '💎', color: '#b9f2ff' },
    { value: 'ruby', label: 'Ruby', emoji: '🔴', color: '#9b111e' },
    { value: 'emerald', label: 'Emerald', emoji: '🟢', color: '#50c878' },
    { value: 'sapphire', label: 'Sapphire', emoji: '🔵', color: '#0f52ba' },
    { value: 'pearl', label: 'Pearl', emoji: '⚪', color: '#f0ead6' },
    { value: 'none', label: 'No Gemstone', emoji: '✨', color: '#eee' }
  ];

  const finishOptions = [
    { value: 'polished', label: 'High Polish', color: '#e2e8f0' },
    { value: 'matte', label: 'Matte/Brushed', color: '#94a3b8' },
    { value: 'hammered', label: 'Hammered', color: '#475569' },
    { value: 'engraved', label: 'Engraved', color: '#f59e0b' }
  ];

  // --- 1. INITIALIZATION & AUTH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchGallery(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 2. API CALLS ---
  const fetchGallery = async (uid) => {
    try {
      const res = await fetch(`${API_BASE_URL}/gallery?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setUserGallery(data);
      }
    } catch (err) {
      console.warn("Gallery fetch failed");
    }
  };

  const loadCollection = async (category) => {
    setActiveCategory(category);
    setActiveTab('collections');
    setMobileMenuOpen(false); // Close menu on mobile
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/collections?category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setCollectionsData(data);
      } else {
        throw new Error();
      }
    } catch (err) {
      setCollectionsData([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (e, id) => {
    e.stopPropagation();
    if(!confirm("Delete this template?")) return;
    const originalData = [...collectionsData];
    setCollectionsData(prev => prev.filter(item => item.id !== id));
    try {
      const res = await fetch(`${API_BASE_URL}/collections?id=${id}&category=${activeCategory}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      alert("Error deleting: " + err.message);
      setCollectionsData(originalData);
    }
  };

  const handleUploadTemplate = async () => {
    if (!newTemplateFile || !newTemplateName) return alert("Select file and name!");
    setStatusMessage("Uploading...");
    try {
      const base64 = await fileToBase64(newTemplateFile);
      const payload = {
        name: newTemplateName,
        category: activeCategory, 
        url: base64, 
        createdAt: new Date().toISOString()
      };
      const res = await fetch(`${API_BASE_URL}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Upload failed");
      await loadCollection(activeCategory);
      setShowUploadModal(false);
      setNewTemplateFile(null);
      setNewTemplateName("");
      setStatusMessage("");
      alert("✅ Uploaded!");
    } catch (err) {
      alert(err.message);
      setStatusMessage("");
    }
  };

  const handleUseTemplate = async (templateUrl, templateName) => {
    setLoading(true);
    setStatusMessage("Loading template...");
    try {
      const response = await fetch(templateUrl);
      const blob = await response.blob();
      const file = new File([blob], `${templateName}.png`, { type: blob.type });
      setSketchFiles([file]);
      setMode('product');
      setActiveTab('create');
      setError("");
    } catch (err) {
      setError("Failed to load template.");
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // --- 3. GENERATION LOGIC ---
  const handleGenerateAll = async () => {
    if (sketchFiles.length === 0) return alert("Please upload a sketch!");
    setLoading(true); setError(""); setProgress({ current: 0, total: sketchFiles.length });
    const instructions = buildInstructions();
    const personB64 = await fileToBase64(personFile);
    const logoB64 = await fileToBase64(logoFile);

    try {
      const newItems = [];
      for (let i = 0; i < sketchFiles.length; i++) {
        try {
          setStatusMessage(`Generating ${i+1}/${sketchFiles.length}...`);
          const sketchB64 = await fileToBase64(sketchFiles[i]);
          const response = await fetch(`${API_BASE_URL}/generate_jewelry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sketch_image: sketchB64,
              person_image: personB64,
              logo_image: logoB64,
              instructions: instructions,
              mode: mode
            })
          });
          if (!response.ok) throw new Error("Generation failed");
          const jsonData = await response.json();
          const newItem = { 
            imageUrl: jsonData.images[0], 
            name: `Design for ${sketchFiles[i].name}`,
            prompt: instructions,
            createdAt: new Date().toISOString()
          };
          newItems.push(newItem);
          await fetch(`${API_BASE_URL}/gallery?userId=${user.uid}`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(newItem)
          });
        } catch (err) {
          console.error(err);
        }
        setProgress({ current: i + 1, total: sketchFiles.length });
      }
      setUserGallery(prev => [...newItems, ...prev]);
      if (newItems.length > 0) setActiveTab('gallery');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); setStatusMessage(""); setProgress({ current: 0, total: 0 });
    }
  };

  // --- HELPERS ---
  const fileToBase64 = (file) => {
    if (!file) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const compressImageForVideo = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
    });
  };

  const buildInstructions = () => {
    const metal = metalOptions.find(m => m.value === metalType)?.label || metalType;
    const gem = gemOptions.find(g => g.value === gemstone)?.label || gemstone;
    const finishType = finishOptions.find(f => f.value === finish)?.label || finish;
    let base = `Professional luxury jewelry photography: ${metal} metal with ${finishType} finish`;
    if (gemstone !== 'none') base += `, featuring ${gem} gemstones`;
    base += mode === 'product' ? `. Studio lighting, white background.` : `. Natural lifestyle setting.`;
    if (customPrompt) base += ` ${customPrompt}`;
    return base;
  };

  // --- HANDLERS ---
  const handleSketchUpload = (e) => setSketchFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeSketch = (idx) => setSketchFiles(prev => prev.filter((_, i) => i !== idx));
  const handlePersonUpload = (e) => setPersonFile(e.target.files[0]);
  const handleLogoUpload = (e) => setLogoFile(e.target.files[0]);
  const handleLogout = () => signOut(auth);

  const handleGenerateVideo = async (imageResult) => {
    setVideoModalOpen(true); setVideoStatus('queued'); setVideoLogs([]);
    try {
      let imageB64 = imageResult.imageUrl || imageResult.url;
      setVideoLogs(p => [{time: new Date().toLocaleTimeString(), message: 'Optimizing...', type:'info'}, ...p]);
      imageB64 = await compressImageForVideo(imageB64);
      const submitRes = await fetch(`${API_BASE_URL}/submit_video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageB64 })
      });
      if(!submitRes.ok) throw new Error("Submit failed");
      const { job_id } = await submitRes.json();
      setVideoJobId(job_id);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/status/${job_id}`);
          if(!res.ok) return;
          const data = await res.json();
          if(data.status === 'processing') setVideoStatus('processing');
          if(data.status === 'completed') {
            clearInterval(pollIntervalRef.current); setVideoStatus('completed'); setVideoResult(data.video_url);
          }
          if(data.status === 'failed') {
            clearInterval(pollIntervalRef.current); setVideoStatus('failed');
          }
        } catch(e) { console.error(e); }
      }, 5000);
    } catch(err) {
      setVideoStatus('failed');
    }
  };
  const closeVideoModal = () => { clearInterval(pollIntervalRef.current); setVideoModalOpen(false); };

  if (authLoading) return <div className="dashboard-layout" style={{justifyContent:'center', alignItems:'center'}}>Loading...</div>;
  if (!user) return <Auth />;

  return (
    <div className="dashboard-layout">
      {/* MOBILE OVERLAY (To Close Menu) */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* 1. SIDEBAR (Hidden on mobile unless toggled) */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">💎</div>
          <div className="logo-text">Lumière <span className="gold-text">Atelier</span></div>
          {/* Close button for Mobile */}
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
          <button className={`nav-item-sub ${activeCategory === 'rings' && activeTab === 'collections' ? 'active' : ''}`} 
                  onClick={() => loadCollection('rings')}>Engagement Rings</button>
          <button className={`nav-item-sub ${activeCategory === 'necklaces' && activeTab === 'collections' ? 'active' : ''}`} 
                  onClick={() => loadCollection('necklaces')}>Necklaces</button>
        </nav>

        <div className="user-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          {showProfileMenu && (
            <div className="profile-menu">
              <button>⚙️ Settings</button>
              <button className="danger" onClick={handleLogout}>🚪 Logout</button>
            </div>
          )}
          <div className="avatar">{user.email ? user.email[0].toUpperCase() : 'U'}</div>
          <div className="user-info">
            <span className="name">{user.email ? user.email.split('@')[0] : 'User'}</span>
            <span className="plan">Customer</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="main-content">
        <header className="top-header">
          {/* HAMBURGER BUTTON (Mobile Only) */}
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>

          <h2 className="page-title">
             {activeTab === 'create' && 'Design Studio'}
             {activeTab === 'gallery' && 'Your Gallery'}
             {activeTab === 'collections' && (activeCategory === 'rings' ? 'Ring Templates' : 'Necklace Templates')}
          </h2>
          {activeTab === 'create' && (
             <button className="btn-primary" onClick={handleGenerateAll} disabled={loading || sketchFiles.length === 0}>
               {loading ? `Working...` : '🚀 Generate'}
             </button>
          )}
          {activeTab === 'collections' && (
             <button className="btn-upload-sm" onClick={() => setShowUploadModal(true)}>📤 Add</button>
          )}
        </header>

        <div className="content-scroll-area">
          {error && <div className="error-banner">{error}</div>}
          {statusMessage && <div style={{textAlign:'center', marginBottom:'1rem', color:'#64748b'}}>{statusMessage}</div>}

          {/* COLLECTIONS VIEW */}
          {activeTab === 'collections' && (
             <div className="create-container">
                {showUploadModal && (
                  <div className="card" style={{border:'2px solid var(--primary)', background:'#fffbeb'}}>
                    <div className="card-header"><h3>Add to {activeCategory}</h3><button onClick={() => setShowUploadModal(false)} style={{border:'none',background:'transparent',cursor:'pointer'}}>✕</button></div>
                    <div style={{display:'flex', gap:'1rem'}}>
                      <input type="text" placeholder="Name" className="select-input" value={newTemplateName} onChange={e=>setNewTemplateName(e.target.value)} />
                      <input type="file" onChange={e=>setNewTemplateFile(e.target.files[0])} />
                      <button className="btn-primary" onClick={handleUploadTemplate}>Upload</button>
                    </div>
                  </div>
                )}
                <div className="gallery-grid">
                   {collectionsData.length === 0 ? <div className="empty-state"><p>No templates.</p></div> : 
                     collectionsData.map((item, idx) => (
                        <div key={idx} className="gallery-card">
                           <div className="img-wrapper">
                              <img src={item.url} alt={item.name} />
                              <div className="overlay">
                                 <button className="btn-primary" onClick={() => handleUseTemplate(item.url, item.name)}>✨ Use</button>
                                 <button className="delete-btn-overlay" onClick={(e) => handleDeleteTemplate(e, item.id)} title="Delete">🗑️</button>
                              </div>
                           </div>
                           <div className="card-info"><h4>{item.name}</h4></div>
                        </div>
                     ))
                   }
                </div>
             </div>
          )}

          {/* CREATE VIEW */}
          {activeTab === 'create' && (
            <div className="create-container">
              <div className="grid-layout">
                <div className="col-left">
                  <div className="card upload-card-lg">
                    <div className="card-header"><h3>Sketches <span className="req">*</span></h3></div>
                    <div className="upload-zone">
                      <input type="file" multiple onChange={handleSketchUpload} />
                      <label>
                          <div className="upload-icon-lg">✏️</div>
                          {sketchFiles.length > 0 ? <div className="file-list-preview">{sketchFiles.map((f, i) => <div key={i} className="file-tag">{f.name} <span onClick={(e)=>{e.preventDefault(); removeSketch(i)}}>✕</span></div>)}</div> : <span>Upload Sketches</span>}
                      </label>
                    </div>
                  </div>
                  <div className="card"><h3>Brand Logo</h3><div className="mini-upload"><input type="file" onChange={handleLogoUpload} /><label>{logoFile ? `✅ ${logoFile.name}` : 'Upload PNG'}</label></div></div>
                  <div className="card"><h3>Custom Prompt</h3><textarea className="text-input" value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Details..." /></div>
                </div>
                <div className="col-right">
                  <div className="card">
                    <h3>Mode</h3>
                    <div className="pill-group">
                       <button className={`pill ${mode==='product'?'active':''}`} onClick={()=>setMode('product')}>📸 Product</button>
                       <button className={`pill ${mode==='try_on'?'active':''}`} onClick={()=>setMode('try_on')}>👤 Try-On</button>
                    </div>
                    {mode === 'try_on' && <div className="mini-upload"><input type="file" onChange={handlePersonUpload} /><label>{personFile ? `✅ ${personFile.name}` : 'Upload Model Photo'}</label></div>}
                  </div>
                  <div className="card"><h3>Metal</h3><div className="grid-select">{metalOptions.map(opt => (<button key={opt.value} className={`grid-btn ${metalType===opt.value?'selected':''}`} onClick={()=>setMetalType(opt.value)}><span className="dot" style={{background:opt.color}}></span><span className="btn-label">{opt.label}</span></button>))}</div></div>
                  <div className="card"><h3>Gemstone</h3><div className="grid-select">{gemOptions.map(opt => (<button key={opt.value} className={`grid-btn ${gemstone===opt.value?'selected':''}`} onClick={()=>setGemstone(opt.value)}><span className="dot" style={{background:opt.color}}></span><span className="btn-label">{opt.label}</span></button>))}</div></div>
                  <div className="card">
                    <h3>Finish</h3>
                    <div className="grid-select">
                      {finishOptions.map(opt => (
                        <button key={opt.value} className={`grid-btn ${finish === opt.value ? 'selected' : ''}`} onClick={() => setFinish(opt.value)}>
                          <span className="dot" style={{background: opt.color}}></span><span className="btn-label">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GALLERY VIEW */}
          {activeTab === 'gallery' && (
            <div className="gallery-container">
               {userGallery.length === 0 ? <div className="empty-state"><h3>Gallery Empty</h3></div> : 
                  <div className="gallery-grid">
                     {userGallery.map((img, idx) => (
                        <div key={idx} className="gallery-card">
                           <div className="img-wrapper">
                              <img src={img.imageUrl || img.url} alt={img.name} />
                              <div className="overlay">
                                 <button className="icon-btn" onClick={() => handleGenerateVideo(img)}>🎬</button>
                                 <a href={img.imageUrl || img.url} download className="icon-btn">⬇️</a>
                              </div>
                           </div>
                           <div className="card-info"><h4>{img.name}</h4><span>{new Date(img.createdAt).toLocaleDateString()}</span></div>
                        </div>
                     ))}
                  </div>
               }
            </div>
          )}
        </div>
      </main>

      {/* VIDEO MODAL */}
      {videoModalOpen && (
         <div className="modal-backdrop">
            <div className="modal-window">
               <div className="modal-header"><h3>AI Video Studio</h3><button className="close-btn" onClick={closeVideoModal}>✕</button></div>
               <div className="video-display">
                  {videoStatus === 'completed' && videoResult ? (
                     <div className="video-success-container"><video src={videoResult} controls autoPlay loop className="final-video" /></div>
                  ) : (
                     <div className="video-loader">
                        <div className={`spinner-ring ${videoStatus === 'failed' ? 'error' : ''}`}></div>
                        <h4>{videoStatus === 'processing' ? 'Rendering...' : 'Waiting...'}</h4>
                     </div>
                  )}
               </div>
               <div className="terminal-logs">{videoLogs.map((log, i) => <div key={i} className={`log-line ${log.type}`}>[{log.time}] {log.message}</div>)}</div>
            </div>
         </div>
      )}
    </div>
  );
}

export default App;