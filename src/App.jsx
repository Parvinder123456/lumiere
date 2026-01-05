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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // --- DESIGN OPTIONS ---
  const [metalType, setMetalType] = useState('yellow-gold');
  const [gemstone, setGemstone] = useState('diamond');
  const [finish, setFinish] = useState('polished');
  
  // ✅ OUTFIT STATE
  const [outfit, setOutfit] = useState('none'); 
  
  const [customPrompt, setCustomPrompt] = useState('');

  // --- VIDEO GENERATION STATE ---
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoStatus, setVideoStatus] = useState('idle');
  const [videoJobId, setVideoJobId] = useState(null);
  const [videoResult, setVideoResult] = useState(null);
  const [videoLogs, setVideoLogs] = useState([]);
  const [videoPrompt, setVideoPrompt] = useState(''); 
  const [currentVideoImage, setCurrentVideoImage] = useState(null); 
  
  const pollIntervalRef = useRef(null);

  // --- UI OPTIONS ARRAYS ---
  
  const metalOptions = [
    { value: 'none', label: 'Original/None', emoji: '🚫', color: '#fff' },
    { value: 'yellow-gold', label: 'Yellow Gold', emoji: '🟡', color: '#E6C200' },
    { value: 'rose-gold', label: 'Rose Gold', emoji: '🟠', color: '#F4C2C2' },
    { value: 'platinum', label: 'Platinum', emoji: '⚪', color: '#E5E4E2' },
    { value: 'silver', label: 'Sterling Silver', emoji: '⚫', color: '#C0C0C0' },
    { value: 'two-tone', label: 'Two-Tone', emoji: '🟡⚪', color: 'linear-gradient(45deg, #E6C200 50%, #E8E8E8 50%)' }
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

  const outfitOptions = [
    { value: 'none', label: 'No Change / None' },
    { value: 'evening-gown', label: 'Evening Gown' },
    { value: 'professional-suit', label: 'Power Suit' },
    { value: 'casual-chic', label: 'Casual Chic' },
    { value: 'bridal', label: 'Bridal Dress' },
    { value: 'boho', label: 'Bohemian' }
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
    setLoading(true); // ✅ Start Loading Spinner
    try {
      const res = await fetch(`${API_BASE_URL}/gallery?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setUserGallery(data);
      }
    } catch (err) {
      console.warn("Gallery fetch failed");
    } finally {
      setLoading(false); // ✅ Stop Loading Spinner
    }
  };

  const loadCollection = async (category) => {
    setActiveCategory(category);
    setActiveTab('collections');
    setMobileMenuOpen(false);
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

  const handleGalleryClick = () => {
    setActiveTab('gallery');
    setMobileMenuOpen(false);
    if (user) {
      fetchGallery(user.uid); // ✅ Triggers spinner logic
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
      
      // ✅ Scroll to top for better mobile UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    setLoading(true); 
    setError(""); 
    setProgress({ current: 0, total: sketchFiles.length });
    
    const instructions = buildInstructions();
    const personB64 = await fileToBase64(personFile);
    const logoB64 = await fileToBase64(logoFile);

    try {
      for (let i = 0; i < sketchFiles.length; i++) {
        try {
          setStatusMessage(`Processing...`); 
          const sketchB64 = await fileToBase64(sketchFiles[i]);
          
          const response = await fetch(`${API_BASE_URL}/generate_jewelry?userId=${user.uid}`, {
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
          if (jsonData.saved) console.log(`✅ Image ${i+1} saved to DB.`);

        } catch (err) {
          console.error(err);
        }
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }
      
      await fetchGallery(user.uid);
      if (sketchFiles.length > 0) setActiveTab('gallery');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); 
      setStatusMessage(""); 
      setProgress({ current: 0, total: 0 }); 
    }
  };

  // --- HELPERS ---
  const fileToBase64 = (file) => {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1024 / img.width, 1024 / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8)); 
        };
      };
    });
  };

  const compressImageForVideo = (base64Str) => {
    return new Promise((resolve) => {
      if(base64Str.startsWith('data:')) return resolve(base64Str);
      
      const img = new Image();
      img.src = base64Str;
      img.crossOrigin = "anonymous"; 
      img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch (e) {
            console.warn("CORS/Canvas error, sending original URL", e);
            resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str); 
    });
  };

  const buildInstructions = () => {
    let base = "Professional luxury jewelry photography";
    if (metalType !== 'none') {
        const metalLabel = metalOptions.find(m => m.value === metalType)?.label || metalType;
        base += `: ${metalLabel} metal with ${finish} finish`;
    } else {
        base += `: keep original material or high quality finish`;
    }

    if (gemstone !== 'none') {
        const gem = gemOptions.find(g => g.value === gemstone)?.label || gemstone;
        base += `, featuring ${gem} gemstones`;
    }
    
    if (mode === 'product') {
        base += `. Studio lighting, white background.`;
    } else {
        base += `. Natural lifestyle setting.`;
        if (outfit !== 'none') {
             const outfitLabel = outfitOptions.find(o => o.value === outfit)?.label || outfit;
             base += ` Model wearing ${outfitLabel}.`;
        }
    }

    if (customPrompt) base += ` ${customPrompt}`;
    return base;
  };

  // --- HANDLERS ---
  const handleSketchUpload = (e) => setSketchFiles(prev => [...prev, ...Array.from(e.target.files)]);
  
  const removeSketch = (idx) => {
    setSketchFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePersonUpload = (e) => setPersonFile(e.target.files[0]);
  const handleLogoUpload = (e) => setLogoFile(e.target.files[0]);
  const handleLogout = () => signOut(auth);

  const handleDeleteGalleryItem = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this design?")) return;
    const previousGallery = [...userGallery];
    setUserGallery(prev => prev.filter(item => item.id !== id));
    try {
      const res = await fetch(`${API_BASE_URL}/gallery?id=${id}&userId=${user.uid}`, { 
        method: 'DELETE' 
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      alert("Could not delete item");
      setUserGallery(previousGallery);
    }
  };

  // --- VIDEO HANDLERS ---
  const handleGenerateVideo = (imageResult) => {
    setCurrentVideoImage(imageResult);
    setVideoModalOpen(true);
    setVideoStatus('prompt');
    setVideoLogs([]);

    const name = imageResult.name ? imageResult.name.toLowerCase() : "";
    let itemType = "jewelry piece";
    if (name.includes("ring")) itemType = "diamond ring";
    else if (name.includes("necklace")) itemType = "gold necklace";
    else if (name.includes("earring")) itemType = "earrings";
    
    setVideoPrompt(`Cinematic slow motion 360-degree rotation of a ${itemType}, studio lighting, 4k, white background`);
  };

  const startVideoGeneration = async () => {
    if (!videoPrompt.trim()) return alert("Please enter a prompt!");
    setVideoStatus('queued'); 
    try {
      const imageResult = currentVideoImage;
      let imageSource = imageResult.imageUrl || imageResult.url;
      let payloadImage = imageSource;

      setVideoLogs(p => [{time: new Date().toLocaleTimeString(), message: 'Preparing image...', type:'info'}, ...p]);

      if (!imageSource.startsWith('http')) {
         payloadImage = await compressImageForVideo(imageSource);
      }
      
      const submitRes = await fetch(`${API_BASE_URL}/submit_video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            image: payloadImage,
            prompt: videoPrompt
        }) 
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

  const closeVideoModal = () => { 
      clearInterval(pollIntervalRef.current); 
      setVideoModalOpen(false); 
      setCurrentVideoImage(null);
  };

  if (authLoading) return <div className="dashboard-layout" style={{justifyContent:'center', alignItems:'center'}}>Loading...</div>;
  if (!user) return <Auth />;

  return (
    <div className="dashboard-layout">
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

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
          <button className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`} onClick={handleGalleryClick}>
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

      <main className="main-content">
        <header className="top-header">
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <h2 className="page-title">
             {activeTab === 'create' && 'Design Studio'}
             {activeTab === 'gallery' && 'Your Gallery'}
             {activeTab === 'collections' && (activeCategory === 'rings' ? 'Ring Templates' : 'Necklace Templates')}
          </h2>
          {activeTab === 'create' && (
             <button className="btn-primary desktop-gen-btn" onClick={handleGenerateAll} disabled={loading || sketchFiles.length === 0}>
               {loading ? `Working...` : '🚀 Generate'}
             </button>
          )}
          {activeTab === 'collections' && (
             <button className="btn-upload-sm" onClick={() => setShowUploadModal(true)}>📤 Add</button>
          )}
        </header>

        <div className="content-scroll-area">
          {error && <div className="error-banner">{error}</div>}
          
          {loading && progress.total > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                 <div className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
              </div>
              <p className="progress-text">
                 {Math.round((progress.current / progress.total) * 100)}% Completed 
                 ({progress.current}/{progress.total} images)
              </p>
            </div>
          )}

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
                
                {loading ? (
                   <div className="empty-state">
                      <div className="spinner-ring" style={{margin:'0 auto 1rem auto'}}></div>
                      <p>Loading templates...</p>
                   </div>
                ) : (
                   <div className="gallery-grid">
                      {collectionsData.length === 0 ? <div className="empty-state"><p>No templates found.</p></div> : 
                        collectionsData.map((item, idx) => (
                           <div key={idx} className="gallery-card">
                              <div className="img-wrapper">
                                 <img src={item.url} alt={item.name} loading="lazy" />
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
                )}
             </div>
          )}

          {activeTab === 'create' && (
            <div className="create-container">
              <div className="grid-layout">
                <div className="col-left">
                  
                  {/* ✅ FIXED UPLOAD CARD LOGIC */}
                  <div className="card upload-card-lg">
                    <div className="card-header"><h3>Sketches <span className="req">*</span></h3></div>
                    
                    <div className={`upload-zone ${sketchFiles.length > 0 ? 'has-files' : ''}`}>
                      <input type="file" multiple onChange={handleSketchUpload} />
                      <label>
                          {sketchFiles.length === 0 && <div className="upload-icon-lg">✏️</div>}
                          <span>{sketchFiles.length > 0 ? 'Add more sketches...' : 'Click to Upload Sketches'}</span>
                      </label>
                    </div>

                    {sketchFiles.length > 0 && (
                        <div className="file-list-preview">
                            {sketchFiles.map((f, i) => (
                                <div key={i} className="file-tag">
                                    <span className="file-name-truncate">{f.name}</span> 
                                    <span className="remove-btn" onClick={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        removeSketch(i); 
                                    }}>✕</span>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>

                  <div className="card"><h3>Brand Logo</h3><div className="mini-upload"><input type="file" onChange={handleLogoUpload} /><label>{logoFile ? `✅ ${logoFile.name}` : 'Upload PNG'}</label></div></div>
                  
                  {/* ✅ OUTFIT: DROPDOWN FOR ALL DEVICES */}
                  <div className="card">
                    <h3>Matching Outfit</h3>
                    <select className="select-input" value={outfit} onChange={(e) => setOutfit(e.target.value)}>
                        {outfitOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                  </div>

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
                  <div className="card"><h3>Metal</h3><div className="grid-select">{metalOptions.map(opt => (<button key={opt.value} className={`grid-btn ${metalType===opt.value?'selected':''}`} onClick={()=>setMetalType(opt.value)}><span className="dot" style={{background:opt.color, border: opt.value==='none'?'1px dashed #ccc':'none'}}></span><span className="btn-label">{opt.label}</span></button>))}</div></div>
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

          {activeTab === 'gallery' && (
            <div className="gallery-container">
               {/* ADDED LOADING CHECK HERE */}
               {loading ? (
                  <div className="empty-state">
                     <div className="spinner-ring" style={{margin:'0 auto 1rem auto'}}></div>
                     <p>Loading your designs...</p>
                  </div>
               ) : (
                  userGallery.length === 0 ? <div className="empty-state"><h3>Gallery Empty</h3></div> : 
                  <div className="gallery-grid">
                      {userGallery.map((img, idx) => (
                        <div key={idx} className="gallery-card">
                           <div className="img-wrapper">
                              <img src={img.imageUrl || img.url} alt={img.name} loading="lazy" />
                              <div className="overlay">
                                 <button className="icon-btn" onClick={() => handleGenerateVideo(img)} title="Create Video">🎬</button>
                                 <a href={img.imageUrl || img.url} download className="icon-btn" title="Download">⬇️</a>
                                 <button className="delete-btn-gallery" onClick={(e) => handleDeleteGalleryItem(e, img.id)} title="Delete">🗑️</button>
                              </div>
                           </div>
                           <div className="card-info"><h4>{img.name}</h4><span>{new Date(img.createdAt).toLocaleDateString()}</span></div>
                        </div>
                      ))}
                  </div>
               )}
            </div>
          )}
        </div>
      </main>

      {activeTab === 'create' && (
        <div className="mobile-fab-container">
           <button className="btn-primary btn-fab" onClick={handleGenerateAll} disabled={loading || sketchFiles.length === 0}>
              {loading ? '⏳' : '🚀 Generate'}
           </button>
        </div>
      )}

      {videoModalOpen && (
         <div className="modal-backdrop">
            <div className="modal-window">
               <div className="modal-header"><h3>AI Video Studio</h3><button className="close-btn" onClick={closeVideoModal}>✕</button></div>
               {videoStatus === 'prompt' && (
                   <div className="video-prompt-container">
                       <div><h4>Describe your video</h4><p>Adjust the prompt to help the AI understand your design.</p></div>
                       <textarea className="text-input" value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} style={{ minHeight: '120px' }} placeholder="E.g. 360 rotation of a gold ring..." />
                       <div className="prompt-tips"><span className="tip-tag">💡 Mention 'Necklace' or 'Ring'</span><span className="tip-tag">💡 Add 'Slow Motion'</span><span className="tip-tag">💡 Add 'White Background'</span></div>
                       <button className="btn-primary" onClick={startVideoGeneration} style={{marginTop:'0.5rem'}}>✨ Start Generation</button>
                   </div>
               )}
               {videoStatus !== 'prompt' && (
                 <>
                   <div className="video-display">
                      {videoStatus === 'completed' && videoResult ? (
                          <div className="video-success-container"><video src={videoResult} controls autoPlay loop className="final-video" /></div>
                      ) : (
                          <div className="video-loader">
                             <div className={`spinner-ring ${videoStatus === 'failed' ? 'error' : ''}`}></div>
                             <h4>{videoStatus === 'processing' ? 'Rendering...' : 'Waiting...'}</h4>
                             <p style={{fontSize:'0.8rem', color:'#64748b', marginTop:'10px', maxWidth:'90%', marginInline:'auto'}}>"{videoPrompt.substring(0, 60)}..."</p>
                          </div>
                      )}
                   </div>
                   <div className="terminal-logs">{videoLogs.map((log, i) => <div key={i} className={`log-line ${log.type}`}>[{log.time}] {log.message}</div>)}</div>
                 </>
               )}
            </div>
         </div>
      )}
    </div>
  );
}

export default App;