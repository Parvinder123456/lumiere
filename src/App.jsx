import { useState, useRef, useEffect } from 'react';
import './App.css';
import Auth from './Auth'; 
import { auth } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

// COMPONENTS
import Sidebar from './components/Sidebar';
import CreateStudio from './components/CreateStudio';
import Gallery from './components/Gallery';
import QuickPickReel from './components/QuickPickReel';
import VideoModal from './components/VideoModal';

// ===================================================================
// 🔧 UTILITY: CLIENT-SIDE IMAGE COMPRESSION (EXTRA DEFENSIVE)
// ===================================================================
const compressAndConvertImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        // Log what we received
        console.log('🔍 Compressing:', {
            name: file?.name,
            type: file?.type,
            size: file?.size,
            isFile: file instanceof File
        });
        
        // Enhanced validation
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }
        
        if (!(file instanceof File)) {
            reject(new Error('Invalid file object'));
            return;
        }
        
        if (!file.type) {
            reject(new Error(`File ${file.name} has no type property`));
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            reject(new Error(`File ${file.name} is not an image (type: ${file.type})`));
            return;
        }

        const reader = new FileReader();
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onerror = () => reject(new Error('Failed to load image'));
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    
                    const originalSize = (file.size / 1024).toFixed(0);
                    const compressedSize = (compressedBase64.length * 0.75 / 1024).toFixed(0);
                    const savings = ((1 - compressedSize / originalSize) * 100).toFixed(0);
                    
                    console.log(`📉 ${file.name}: ${originalSize}KB → ${compressedSize}KB (${savings}% smaller)`);
                    resolve(compressedBase64);
                } catch (error) {
                    reject(new Error('Image processing failed: ' + error.message));
                }
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    });
};

// ===================================================================
// 🔧 UTILITY: GET VALID FIREBASE TOKEN (WITH AUTO-REFRESH)
// ===================================================================
const getValidToken = async (currentUser) => {
    try {
        return await currentUser.getIdToken(true);
    } catch (error) {
        console.error("Token refresh failed:", error);
        throw new Error("Session expired. Please login again.");
    }
};

// ===================================================================
// 🎨 CONSTANTS (Moved outside component for performance)
// ===================================================================
const METAL_OPTIONS = [
    {value:'yellow-gold', label:'Yellow Gold', color:'#E6C200'},
    {value:'rose-gold', label:'Rose Gold', color:'#F4C2C2'},
    {value:'platinum', label:'Platinum', color:'#E5E4E2'},
    {value:'silver', label:'Silver', color:'#C0C0C0'}
];

const GEM_OPTIONS = [
    {value:'diamond', label:'Diamond', color:'#b9f2ff'},
    {value:'ruby', label:'Ruby', color:'#9b111e'},
    {value:'emerald', label:'Emerald', color:'#50c878'},
    {value:'sapphire', label:'Sapphire', color:'#0f52ba'}
];

const FINISH_OPTIONS = [
    {value:'polished', label:'High Polish', color:'#e2e8f0'},
    {value:'matte', label:'Matte', color:'#94a3b8'},
    {value:'hammered', label:'Hammered', color:'#475569'}
];

const OUTFIT_OPTIONS = [
    {value:'none', label:'None'},
    {value:'evening-gown', label:'Evening Gown'},
    {value:'bridal', label:'Bridal'},
    {value:'boho', label:'Bohemian'}
];

function App() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lumiere-func-linux.azurewebsites.net/api';
  
  // --- STATE ---
  const [user, setUser] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const [credits, setCredits] = useState(0); 

  const [activeTab, setActiveTab] = useState('create');
  const [activeCategory, setActiveCategory] = useState('rings');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [collectionsData, setCollectionsData] = useState([]);
  const [userGallery, setUserGallery] = useState([]);
  
  const [sketchFiles, setSketchFiles] = useState([]);
  const [personFile, setPersonFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  
  const [mode, setMode] = useState('product');
  const [metalType, setMetalType] = useState('yellow-gold');
  const [gemstone, setGemstone] = useState('diamond');
  const [finish, setFinish] = useState('polished');
  const [outfit, setOutfit] = useState('none');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoStatus, setVideoStatus] = useState('idle');
  const [videoResult, setVideoResult] = useState(null);
  const [videoLogs, setVideoLogs] = useState([]);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [currentVideoImage, setCurrentVideoImage] = useState(null);
  const pollIntervalRef = useRef(null);

  // --- INIT + CLEANUP ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
          fetchGallery(currentUser);
          fetchUserProfile(currentUser);
          
          fetch(`${API_BASE_URL}/collections?category=rings`).then(r=>r.json()).catch(console.error);
          fetch(`${API_BASE_URL}/collections?category=necklaces`).then(r=>r.json()).catch(console.error);
      }
    });
    
    return () => {
        unsubscribe();
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
    };
  }, []);

  // --- API HELPERS ---
  const fetchUserProfile = async (currentUser) => {
    try {
        const token = await getValidToken(currentUser);
        const res = await fetch(`${API_BASE_URL}/getUserProfile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setCredits(data.credits);
        }
    } catch (e) { 
        console.error("Credit fetch failed:", e); 
    }
  };

  const fetchGallery = async (currentUser) => {
    if(!currentUser) return;
    setLoading(true);
    try {
      const token = await getValidToken(currentUser);
      const res = await fetch(`${API_BASE_URL}/gallery?userId=${currentUser.uid}`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) setUserGallery(await res.json());
    } catch(e) { 
        console.error(e); 
    } finally { 
        setLoading(false); 
    }
  };

  const loadCollection = async (category) => {
    setActiveCategory(category);
    setActiveTab('collections');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/collections?category=${category}`);
      if(res.ok) setCollectionsData(await res.json());
    } catch(e) { 
        setCollectionsData([]); 
    } finally { 
        setLoading(false); 
    }
  };

  // ===================================================================
  // 🟢 COLLECTION UPLOAD (Single + Multiple File Support)
  // ===================================================================
  const handleCollectionUpload = async (files, setUploadProgress) => {
    console.log('🔍 Received files:', files);
    
    if (!files || files.length === 0) {
        console.warn('No files provided');
        return;
    }
    
    // Convert to array if not already
    const fileArray = Array.isArray(files) ? [...files] : [files]; 
    
    console.log(`🔍 Processing ${fileArray.length} files`);
    
    // Validate EACH file individually
    const validFiles = [];
    for (let i = 0; i < fileArray.length; i++) {
        const f = fileArray[i];
        if (f && f instanceof File && f.type && f.type.startsWith('image/')) {
            validFiles.push(f);
        } else {
            console.warn(` ❌ Invalid file at index ${i}:`, f);
        }
    }
    
    if (validFiles.length === 0) {
        alert('No valid image files found');
        return;
    }
    
    setLoading(true);
    setProgress({ current: 0, total: validFiles.length });

    const results = { succeeded: 0, failed: 0, errors: [] };

    try {
        const token = await getValidToken(user);
        
        // Process files sequentially
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            
            try {
                const compressedBase64 = await compressAndConvertImage(file, 800);
                const fileName = file.name.replace(/\.[^/.]+$/, "");

                const res = await fetch(`${API_BASE_URL}/collections`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        image: compressedBase64,
                        category: activeCategory, 
                        name: fileName
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Upload failed');
                }
                
                results.succeeded++;
                
            } catch (fileError) {
                console.error(`❌ [${i + 1}/${validFiles.length}] Failed:`, fileError);
                results.failed++;
                results.errors.push(`${file.name}: ${fileError.message}`);
            }
            
            // Update progress after each file
            setProgress({ current: i + 1, total: validFiles.length });
            if (setUploadProgress) {
                setUploadProgress({ current: i + 1, total: validFiles.length });
            }
        }
        
        // Reload collection
        await loadCollection(activeCategory);
        
        if (results.failed > 0) {
            alert(`Upload complete!\n✅ ${results.succeeded} succeeded\n❌ ${results.failed} failed\n\nErrors:\n${results.errors.join('\n')}`);
        }
        
    } catch (e) {
        console.error("💥 Fatal upload error:", e);
        alert("Error uploading: " + e.message);
    } finally {
        setLoading(false);
        setProgress({ current: 0, total: 0 });
    }
  };

  // ===================================================================
  // 🎨 GENERATION HANDLER
  // ===================================================================
  const handleGenerateAll = async () => {
    if (sketchFiles.length === 0) return alert("Upload a sketch first.");
    if (credits < sketchFiles.length) return alert(`Not enough credits! You need ${sketchFiles.length}, but have ${credits}.`);

    setLoading(true); 
    setError(""); 
    setProgress({ current: 0, total: sketchFiles.length });

    const instructions = `Jewelry: ${metalType}, ${gemstone}, ${finish}. ${mode === 'product' ? 'Studio shot' : 'Lifestyle shot ' + outfit}. ${customPrompt}`;
    
    try {
        const token = await getValidToken(user);
        
        const personB64 = personFile ? await compressAndConvertImage(personFile, 1024) : null;
        const logoB64 = logoFile ? await compressAndConvertImage(logoFile, 500) : null;

        for (let i = 0; i < sketchFiles.length; i++) {
            const sketchB64 = await compressAndConvertImage(sketchFiles[i], 1024);
            
            const response = await fetch(`${API_BASE_URL}/generate_jewelry`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}`,
                    'X-Request-ID': crypto.randomUUID()
                },
                body: JSON.stringify({ 
                    sketch_image: sketchB64, 
                    person_image: personB64, 
                    logo_image: logoB64, 
                    instructions, 
                    mode 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Generation failed for ${sketchFiles[i].name}`);
            }
            
            const successData = await response.json();
            
            if(successData.remaining_credits !== undefined) {
                setCredits(successData.remaining_credits);
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));
        }
        
        await fetchGallery(user);
        setActiveTab('gallery');
        
    } catch (err) { 
        console.error("Generation error:", err);
        setError(err.message);
        alert(err.message); 
        await fetchUserProfile(user); 
    } finally { 
        setLoading(false); 
        setProgress({ current: 0, total: 0 }); 
    }
  };

  // ===================================================================
  // 🗑️ DELETE HANDLERS
  // ===================================================================
  const handleDeleteGalleryItem = async (e, id) => {
    e.stopPropagation(); 
    if(!confirm("Delete this image?")) return;
    
    setUserGallery(prev => prev.filter(x => x.id !== id));
    
    try {
      const token = await getValidToken(user);
      await fetch(`${API_BASE_URL}/gallery?id=${id}`, { 
          method: 'DELETE', 
          headers: { 'Authorization': `Bearer ${token}` } 
      });
    } catch(e) { 
        alert("Delete failed"); 
        fetchGallery(user);
    }
  };

  const handleDeleteCollectionItem = async (e, id) => {
    e.stopPropagation(); 
    if(!confirm("Delete from Collection?")) return;
    
    setCollectionsData(prev => prev.filter(x => x.id !== id)); 
    
    try {
      const token = await getValidToken(user);
      await fetch(`${API_BASE_URL}/collections?id=${id}&category=${activeCategory}`, { 
          method: 'DELETE', 
          headers: { 'Authorization': `Bearer ${token}` } 
      });
    } catch(e) { 
        alert("Delete failed"); 
        loadCollection(activeCategory);
    }
  };

  // ===================================================================
  // 🎬 VIDEO HANDLERS
  // ===================================================================
  const handleGenerateVideo = (img) => { 
      setCurrentVideoImage(img); 
      setVideoModalOpen(true); 
      setVideoStatus('prompt'); 
      setVideoLogs([]); 
      setVideoPrompt(`Cinematic 360 rotation of ${img.name}, studio lighting, 4k`); 
  };

  const startVideoGeneration = async () => {
    if (!videoPrompt.trim()) return alert("Please enter a prompt!");
    if (credits < 3) return alert(`Not enough credits! Video costs 3 credits.`);
    
    setVideoStatus('queued');
    
    try {
        let image = currentVideoImage.imageUrl || currentVideoImage.url;
        const token = await getValidToken(user);
        
        const res = await fetch(`${API_BASE_URL}/submit_video`, {
            method: 'POST', 
            headers: {
                'Content-Type':'application/json', 
                'Authorization': `Bearer ${token}`,
                'X-Request-ID': crypto.randomUUID()
            },
            body: JSON.stringify({ image, prompt: videoPrompt })
        });
        
        if(!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Video submission failed");
        }
        
        const data = await res.json();
        
        if (data.remaining_credits !== undefined) {
            setCredits(data.remaining_credits);
        }
        
        const { job_id } = data;
        
        pollIntervalRef.current = setInterval(async () => {
            try {
                const sRes = await fetch(`${API_BASE_URL}/status/${job_id}`);
                if(sRes.ok) {
                    const statusData = await sRes.json();
                    
                    if(statusData.status === 'processing') {
                        setVideoStatus('processing');
                    }
                    
                    if(statusData.status === 'completed') { 
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                        setVideoStatus('completed'); 
                        setVideoResult(statusData.video_url); 
                    }
                    
                    if(statusData.status === 'failed') { 
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                        setVideoStatus('failed'); 
                        alert('Video generation failed. Credits have been refunded.');
                        await fetchUserProfile(user); 
                    }
                }
            } catch(e) {
                console.error('Polling error:', e);
            }
        }, 5000);
        
    } catch(e) { 
        setVideoStatus('failed'); 
        alert(e.message); 
        await fetchUserProfile(user); 
    }
  };

// ===================================================================
// 🎨 TEMPLATE HANDLERS (Simple Proxy Version)
// ===================================================================
const handleUseTemplate = async (url, name) => {
  setLoading(true);
  setError("");
  
  try {
    // Build proxy URL
    const proxyUrl = `${API_BASE_URL}/proxyimage?url=${encodeURIComponent(url)}`;
    
    console.log('📥 Fetching via proxy:', proxyUrl);

    const response = await fetch(proxyUrl, {
        method: 'GET'
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Proxy returned ${response.status}: ${errorText}`);
    }

    const blob = await response.blob();
    
    console.log('✅ Blob received:', blob.size, 'bytes, type:', blob.type);
    
    const file = new File([blob], `${name}.png`, { type: blob.type || 'image/png' });
    
    setSketchFiles([file]);
    setMode('product');
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('✅ Template loaded successfully');

  } catch (err) { 
    console.error('❌ Template load failed:', err);
    setError(`Failed to load template: ${err.message}`);
    
    // Show user-friendly error
    alert(`Could not load template:\n${err.message}\n\nMake sure your backend is running on ${API_BASE_URL}`);
  } finally { 
    setLoading(false); 
  }
};



  const handleReelSelect = (url, name) => handleUseTemplate(url, name);
  const handleLogout = () => signOut(auth);

  // --- RENDER ---
  if (authLoading) {
      return (
          <div className="dashboard-layout" style={{justifyContent:'center', alignItems:'center'}}>
              <div className="spinner-ring"></div>
              <p>Loading...</p>
          </div>
      );
  }
  
  if (!user) return <Auth />;

  return (
    <div className="dashboard-layout">
      <Sidebar 
          user={user} 
          credits={credits} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          activeCategory={activeCategory} 
          loadCollection={loadCollection} 
          handleLogout={handleLogout} 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen} 
      />
      
      <main className="main-content">
        <header className="top-header">
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <h2 className="page-title">
              {activeTab === 'create' ? 'Design Studio' : activeTab === 'gallery' ? 'My Gallery' : `${activeCategory} Collection`}
          </h2>
          {activeTab === 'create' && (
              <button 
                  className="btn-primary desktop-gen-btn" 
                  onClick={handleGenerateAll} 
                  disabled={loading || sketchFiles.length === 0}
              >
                  {loading ? `Working...` : '🚀 Generate'}
              </button>
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
                      Processing {progress.current} of {progress.total}...
                  </p>
              </div>
          )}

          {activeTab === 'collections' && (
             <Gallery 
                items={collectionsData} 
                loading={loading} 
                type="collection" 
                handleUseTemplate={handleUseTemplate} 
                handleDelete={handleDeleteCollectionItem} 
                handleUpload={handleCollectionUpload}
             />
          )}

          {activeTab === 'create' && (
            <CreateStudio 
                sketchFiles={sketchFiles} 
                setSketchFiles={setSketchFiles} 
                personFile={personFile} 
                setPersonFile={setPersonFile} 
                logoFile={logoFile} 
                setLogoFile={setLogoFile} 
                customPrompt={customPrompt} 
                setCustomPrompt={setCustomPrompt} 
                mode={mode} 
                setMode={setMode} 
                metalType={metalType} 
                setMetalType={setMetalType} 
                gemstone={gemstone} 
                setGemstone={setGemstone} 
                finish={finish} 
                setFinish={setFinish} 
                outfit={outfit} 
                setOutfit={setOutfit} 
                loading={loading} 
                handleGenerateAll={handleGenerateAll} 
                metalOptions={METAL_OPTIONS} 
                gemOptions={GEM_OPTIONS} 
                finishOptions={FINISH_OPTIONS} 
                outfitOptions={OUTFIT_OPTIONS} 
            />
          )}

          {activeTab === 'gallery' && (
            <Gallery 
                items={userGallery} 
                loading={loading} 
                type="user" 
                handleGenerateVideo={handleGenerateVideo} 
                handleDelete={handleDeleteGalleryItem} 
            />
          )}
        </div>
      </main>
      
      {activeTab === 'create' && (
          <QuickPickReel 
              API_BASE_URL={API_BASE_URL} 
              onSelectTemplate={handleReelSelect} 
          />
      )}
      
      <VideoModal 
          isOpen={videoModalOpen} 
          onClose={() => {
              setVideoModalOpen(false); 
              if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
              }
          }} 
          status={videoStatus} 
          result={videoResult} 
          logs={videoLogs} 
          prompt={videoPrompt} 
          setPrompt={setVideoPrompt} 
          startGeneration={startVideoGeneration} 
      />
    </div>
  );
}

export default App;