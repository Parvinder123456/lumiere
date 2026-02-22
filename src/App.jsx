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
import LogoModal from './components/LogoModal';

// 🔧 MOBILE-OPTIMIZED IMAGE COMPRESSION WITH BLOB SUPPORT
const compressAndConvertImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Compressing:', {
      name: file?.name,
      type: file?.type,
      size: file?.size ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'unknown',
      isFile: file instanceof File,
      isBlob: file instanceof Blob
    });

    // ✅ VALIDATION - Accept both File and Blob
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    if (!(file instanceof File) && !(file instanceof Blob)) {
      reject(new Error('Invalid file object - must be File or Blob'));
      return;
    }

    // 🔧 Handle missing or wrong file type
    let fileType = file.type;
    if (!fileType || fileType === '' || fileType === 'application/octet-stream') {
      const fileName = file.name || '';
      const ext = fileName.split('.').pop().toLowerCase();
      
      if (ext === 'png') fileType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') fileType = 'image/jpeg';
      else if (ext === 'webp') fileType = 'image/webp';
      else fileType = 'image/jpeg'; // Default
      
      console.warn('⚠️ File type missing, using:', fileType);
    }

    if (!fileType.startsWith('image/')) {
      reject(new Error(`Not an image file (type: ${fileType})`));
      return;
    }

    // 👇 MOBILE DETECTION & AGGRESSIVE OPTIMIZATION
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLargeFile = file.size > 3 * 1024 * 1024; // > 3MB
    
    let targetWidth = maxWidth;
    let targetQuality = quality;
    
    if (isMobile) {
      targetWidth = 600;
      targetQuality = 0.65;
      
      if (isLargeFile) {
        targetWidth = 500;
        targetQuality = 0.6;
      }
    }

    console.log(`📱 ${isMobile ? 'Mobile' : 'Desktop'} | ${isLargeFile ? 'Large' : 'Normal'} file`);
    console.log(`🎯 Target: ${targetWidth}px @ ${Math.round(targetQuality * 100)}% quality`);

    const reader = new FileReader();
    
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
      reject(new Error('Failed to read file. Please try a different image.'));
    };
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = (error) => {
        console.error('❌ Image load error:', error);
        reject(new Error('Failed to load image. The file may be corrupted.'));
      };
      
      img.onload = () => {
        try {
          console.log(`📐 Original: ${img.width}x${img.height}`);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let width = img.width;
          let height = img.height;

          if (width > targetWidth) {
            height = Math.round((height * targetWidth) / width);
            width = targetWidth;
          }

          if (isMobile && height > 800) {
            width = Math.round((width * 800) / height);
            height = 800;
          }

          canvas.width = width;
          canvas.height = height;

          console.log(`📐 Compressed: ${width}x${height}`);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let compressedBase64;
          try {
            compressedBase64 = canvas.toDataURL('image/jpeg', targetQuality);
          } catch (canvasError) {
            console.error('❌ Canvas error:', canvasError);
            reject(new Error('Failed to process image. Try taking a new photo.'));
            return;
          }

          const originalSize = (file.size / 1024).toFixed(0);
          const compressedSize = (compressedBase64.length * 0.75 / 1024).toFixed(0);
          const savings = ((1 - (compressedSize / originalSize)) * 100).toFixed(0);
          
          console.log(`✅ ${originalSize}KB → ${compressedSize}KB (${savings}% saved)`);

          resolve(compressedBase64);
        } catch (error) {
          console.error('❌ Compression failed:', error);
          reject(new Error('Image processing failed: ' + error.message));
        }
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  });
};

// UTILITY: GET VALID FIREBASE TOKEN
const getValidToken = async (currentUser) => {
  try {
    return await currentUser.getIdToken(true);
  } catch (error) {
    console.error('Token refresh failed', error);
    throw new Error('Session expired. Please login again.');
  }
};

// CONSTANTS
const METAL_OPTIONS = [
  { value: 'none', label: 'None', color: 'transparent' },
  { value: 'yellow-gold', label: 'Yellow Gold', color: '#E6C200' },
  { value: 'rose-gold', label: 'Rose Gold', color: '#F4C2C2' },
  { value: 'platinum', label: 'Platinum', color: '#E5E4E2' },
  { value: 'silver', label: 'Silver', color: '#C0C0C0' }
];

const GEM_OPTIONS = [
  { value: 'none', label: 'None', color: 'transparent' },
  { value: 'diamond', label: 'Diamond', color: '#b9f2ff' },
  { value: 'ruby', label: 'Ruby', color: '#9b111e' },
  { value: 'emerald', label: 'Emerald', color: '#50c878' },
  { value: 'sapphire', label: 'Sapphire', color: '#0f52ba' }
];

const FINISH_OPTIONS = [
  { value: 'none', label: 'None', color: 'transparent' },
  { value: 'polished', label: 'Polish', color: '#e2e8f0' },
  { value: 'matte', label: 'Matte', color: '#94a3b8' },
  { value: 'hammered', label: 'Hammered', color: '#475569' }
];

const OUTFIT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'evening-gown', label: 'Evening Gown' },
  { value: 'bridal', label: 'Bridal' },
  { value: 'boho', label: 'Bohemian' }
];

function App() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api';

  // --- STATE ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [logoUrl, setLogoUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [activeCategory, setActiveCategory] = useState('rings');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [collectionsData, setCollectionsData] = useState([]);
  const [userGallery, setUserGallery] = useState([]);
  
  // 🔧 NOW STORES: [{ name, base64, size, timestamp }]
  const [sketchFiles, setSketchFiles] = useState([]);
  
  // 🔧 UPDATED: Stores { name, base64, file }
  const [personData, setPersonData] = useState(null);
  
  const [customPrompt, setCustomPrompt] = useState('');
  const [mode, setMode] = useState('product');
  const [metalType, setMetalType] = useState('none');
  const [gemstone, setGemstone] = useState('none');
  const [finish, setFinish] = useState('none');
  const [outfit, setOutfit] = useState('none');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoStatus, setVideoStatus] = useState('idle');
  const [videoResult, setVideoResult] = useState(null);
  const [videoLogs, setVideoLogs] = useState([]);
  const [videoPrompt, setVideoPrompt] = useState('A cinematic, slow-panning close-up view of the jewelry piece. Extreme focus on the exact textures, gems, and metalwork details shown in the image. Professional studio lighting to highlight sparkle. Do NOT perform a 360 rotation. Strictly adhere to the provided design; do not hallucinate, add, or alter any features. Photorealistic 4K.');
  const [currentVideoImage, setCurrentVideoImage] = useState(null);
  const pollIntervalRef = useRef(null);

  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // --- INIT & CLEANUP ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchGallery(currentUser);
        fetchUserProfile(currentUser);
        
        // 🔒 FIX: Secure Prefetch (Pass Token)
        currentUser.getIdToken().then(token => {
            const headers = { 'Authorization': `Bearer ${token}` };
            fetch(`${API_BASE_URL}/collections?category=rings`, { headers })
                .then(r => r.ok ? r.json() : [])
                .catch(console.error);
            fetch(`${API_BASE_URL}/collections?category=necklaces`, { headers })
                .then(r => r.ok ? r.json() : [])
                .catch(console.error);
        });
      }
    });

    return () => {
      unsubscribe();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
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
        setLogoUrl(data.logoUrl || null);
      }
    } catch (e) {
      console.error('Credit fetch failed', e);
    }
  };

  const fetchGallery = async (currentUser) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const token = await getValidToken(currentUser);
      const res = await fetch(`${API_BASE_URL}/gallery?userId=${currentUser.uid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUserGallery(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCollection = async (category) => {
    setActiveCategory(category);
    setActiveTab('collections');
    setMobileMenuOpen(false);
    setLoading(true);
    try {
      // 🔒 FIX: Secure Fetch (Pass Token)
      const token = await getValidToken(user); 
      const res = await fetch(`${API_BASE_URL}/collections?category=${category}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setCollectionsData(await res.json());
      } else {
        setCollectionsData([]); // Handle empty or 401 gracefullly
      }
    } catch (e) {
      console.error("Load failed:", e);
      setCollectionsData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  // 🔧 NEW: Handle Person Upload Immediately
  const handlePersonUpload = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    setLoading(true);
    try {
        console.log('👤 Processing person image immediately...');
        const base64 = await compressAndConvertImage(file);
        
        setPersonData({
            name: file.name,
            base64: base64,
            file: file
        });
        console.log('✅ Person image ready');
    } catch (error) {
        console.error('Person upload error:', error);
        alert('Failed to process person image: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleLogoUpload = async (file) => {
    setUploadingLogo(true);
    try {
      const token = await getValidToken(user);
      const compressedBase64 = await compressAndConvertImage(file, 300);

      const res = await fetch(`${API_BASE_URL}/uploadLogo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: compressedBase64 })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      setLogoUrl(data.logoUrl);
      alert('✅ Logo uploaded successfully!');
      
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Failed to upload logo: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!confirm('Remove your brand logo? You can upload a new one anytime.')) return;

    setUploadingLogo(true);
    try {
      const token = await getValidToken(user);

      const res = await fetch(`${API_BASE_URL}/uploadLogo`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to remove logo');
      }

      setLogoUrl(null);
      alert('✅ Logo removed successfully!');
      
    } catch (error) {
      console.error('Logo remove error:', error);
      alert('Failed to remove logo: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCollectionUpload = async (files, setUploadProgress) => {
    console.log('📁 Received files:', files);
    if (!files || files.length === 0) {
      console.warn('No files provided');
      return;
    }

    const fileArray = Array.isArray(files) ? [...files] : [files];
    console.log('📦 Processing', fileArray.length, 'files');

    const validFiles = [];
    for (let i = 0; i < fileArray.length; i++) {
      const f = fileArray[i];
      if (f && f instanceof File && f.type && f.type.startsWith('image/')) {
        validFiles.push(f);
      } else {
        console.warn('⚠️ Invalid file at index', i, f);
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

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        try {
          const compressedBase64 = await compressAndConvertImage(file, 800);
          const fileName = file.name.replace(/\.[^/.]+$/, '');

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

        setProgress({ current: i + 1, total: validFiles.length });
        if (setUploadProgress) {
          setUploadProgress({ current: i + 1, total: validFiles.length });
        }
      }

      await loadCollection(activeCategory);

      if (results.failed > 0) {
        alert(`Upload complete!\n✅ ${results.succeeded} succeeded\n❌ ${results.failed} failed\n\nErrors:\n${results.errors.join('\n')}`);
      } else {
        alert(`✅ All ${results.succeeded} images uploaded successfully!`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // 🔧 NEW: PROCESS FILES IMMEDIATELY WHEN UPLOADED
  const handleSketchUpload = async (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    console.log(`📁 Processing ${fileArray.length} sketch files immediately...`);

    setLoading(true);
    setProgress({ current: 0, total: fileArray.length });

    const processedFiles = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      try {
        console.log(`[${i + 1}/${fileArray.length}] Processing ${file.name}...`);
        
        const base64 = await compressAndConvertImage(file);
        
        processedFiles.push({
          name: file.name,
          base64: base64,
          size: file.size,
          timestamp: Date.now()
        });

        console.log(`✅ ${file.name} processed`);
        
      } catch (fileError) {
        console.error(`❌ Failed to process ${file.name}:`, fileError);
        alert(`Failed to process ${file.name}: ${fileError.message}`);
      }

      setProgress({ current: i + 1, total: fileArray.length });
    }

    if (processedFiles.length > 0) {
      setSketchFiles(prev => [...prev, ...processedFiles]);
      alert(`✅ ${processedFiles.length} image(s) ready!`);
    }

    setLoading(false);
    setProgress({ current: 0, total: 0 });
  };

  // 🔧 UPDATED: USE STORED BASE64 DATA
  const handleGenerateAll = async () => {
    if (sketchFiles.length === 0) {
      alert('Please upload at least one sketch!');
      return;
    }

    setLoading(true);
    setError('');
    setProgress({ current: 0, total: sketchFiles.length });

    const instructionParts = [];
    if (metalType !== 'none') instructionParts.push(`${metalType} metal`);
    if (gemstone !== 'none') instructionParts.push(`${gemstone} gemstone`);
    if (finish !== 'none') instructionParts.push(`${finish} finish`);
    if (mode === 'try_on') {
       instructionParts.push("IMPORTANT: First, digitally remove any existing jewelry the person in the image is currently wearing (earrings, necklaces, etc.) to create a clean base. Then, realistically place the new jewelry design shown in the sketch onto the person.");
    }
    if (customPrompt.trim()) instructionParts.push(customPrompt.trim());
    const instructions = instructionParts.join(', ');

    try {
      const token = await getValidToken(user);

      // 🔧 PREPARE PERSON IMAGE (Use stored base64)
      let personBase64 = null;
      if (mode === 'try_on') {
        if (!personData) {
            alert('Please upload a person/selfie image for Try-On mode!');
            setLoading(false);
            return;
        }
        personBase64 = personData.base64; // ✅ Use already compressed data
      }

      for (let i = 0; i < sketchFiles.length; i++) {
        const processedFile = sketchFiles[i]; // { name, base64, size, timestamp }

        try {
          console.log(`📤 [${i + 1}/${sketchFiles.length}] Sending: ${processedFile.name}`);
          
          const sketchBase64 = processedFile.base64;

          console.log('🚀 Sending to API...');
          const res = await fetch(`${API_BASE_URL}/generate_jewelry`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              sketch_image: sketchBase64,
              person_image: personBase64,
              instructions: instructions,
              mode: mode
            })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Generation failed');
          }

          const data = await res.json();
          console.log(`✅ [${i + 1}/${sketchFiles.length}] Generation successful!`);
          
          if (data.remaining_credits !== undefined) {
            setCredits(data.remaining_credits);
          }

          setProgress({ current: i + 1, total: sketchFiles.length });

        } catch (fileError) {
          console.error(`❌ Failed to generate ${processedFile.name}:`, fileError);
          alert(`❌ Error with ${processedFile.name}:\n\n${fileError.message}`);
        }
      }

      alert('✅ All designs generated!');
      await fetchGallery(user);
      setActiveTab('gallery');

    } catch (error) {
      console.error('❌ Generation error:', error);
      setError(error.message);
      alert(`Generation failed: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleDeleteGallery = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this design?')) return;

    try {
      const token = await getValidToken(user);
      const res = await fetch(`${API_BASE_URL}/gallery?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setUserGallery(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete');
    }
  };

  const handleDeleteCollection = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this item?')) return;

    try {
      const token = await getValidToken(user);
      const res = await fetch(`${API_BASE_URL}/collections?id=${id}&category=${activeCategory}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setCollectionsData(prev => prev.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete');
    }
  };

  const handleUseTemplate = async (imageUrl, name) => {
    try {
      console.log('📥 Loading template:', { imageUrl, name });
      
      const proxyUrl = `${API_BASE_URL}/proxyimage?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) throw new Error('Failed to load template');

      const blob = await response.blob();
      
      console.log('📦 Blob received:', { type: blob.type, size: `${(blob.size / 1024).toFixed(0)}KB` });

      // 🔧 FIX: Ensure blob has correct MIME type
      let blobType = blob.type;
      if (!blobType || blobType === '' || blobType === 'application/octet-stream') {
        if (imageUrl.includes('.png')) blobType = 'image/png';
        else if (imageUrl.includes('.webp')) blobType = 'image/webp';
        else blobType = 'image/jpeg';
        console.log('⚠️ Blob type missing, using:', blobType);
      }

      const correctBlob = blobType !== blob.type ? new Blob([blob], { type: blobType }) : blob;
      const fileName = name || 'template.jpg';
      const file = new File([correctBlob], fileName, { type: blobType, lastModified: Date.now() });

      console.log('✅ File created:', { name: file.name, type: file.type });

      // 🔧 PROCESS IMMEDIATELY
      await handleSketchUpload([file]);
      
      setActiveTab('create');
      setMobileMenuOpen(false);
      
    } catch (error) {
      console.error('❌ Template load error:', error);
      alert('Failed to load template: ' + error.message);
    }
  };

  const handleGenerateVideo = (image) => {
    setCurrentVideoImage(image);
    setVideoStatus('prompt');
    setVideoResult(null);
    setVideoLogs([]);
    setVideoPrompt('Cinematic view of jewelry, smooth camera movement, professional lighting');
    setVideoModalOpen(true);
  };

  const startVideoGeneration = async () => {
    if (!currentVideoImage || !videoPrompt) return;

    setVideoStatus('queued');
    setVideoLogs([{ time: new Date().toLocaleTimeString(), message: 'Submitting job...', type: 'info' }]);

    try {
      const token = await getValidToken(user);
      const res = await fetch(`${API_BASE_URL}/submit_video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image: currentVideoImage.imageUrl || currentVideoImage.url,
          prompt: videoPrompt
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit video job');
      }

      const data = await res.json();
      
      if (data.remaining_credits !== undefined) {
        setCredits(data.remaining_credits);
      }

      setVideoLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Job ID: ${data.job_id}`, type: 'success' }]);
      setVideoStatus('processing');

      pollVideoStatus(data.job_id);

    } catch (error) {
      console.error('Video error:', error);
      setVideoLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Error: ${error.message}`, type: 'error' }]);
      setVideoStatus('idle');
    }
  };

  const pollVideoStatus = (jobId) => {
    let attempts = 0;
    const maxAttempts = 180;

    pollIntervalRef.current = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollIntervalRef.current);
        setVideoLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: 'Timeout: Video generation took too long', type: 'error' }]);
        setVideoStatus('idle');
        return;
      }

      try {
        const token = await getValidToken(user);
        const res = await fetch(`${API_BASE_URL}/status/${jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          setVideoResult(data.video_url);
          setVideoStatus('completed');
          setVideoLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `✅ Video ready! (${data.processing_time})`, type: 'success' }]);
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setVideoLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `❌ Generation failed: ${data.error}`, type: 'error' }]);
          setVideoStatus('idle');
        } else if (attempts % 6 === 0) {
          setVideoLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `Processing... (${attempts * 5}s elapsed)`, type: 'info' }]);
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 5000);
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      }}>
        <div className="spinner-ring"></div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="dashboard-layout">
      <Sidebar
        user={user}
        credits={credits}
        logoUrl={logoUrl}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCategory={activeCategory}
        loadCollection={loadCollection}
        handleLogout={() => signOut(auth)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onManageLogo={() => setLogoModalOpen(true)}
      />

      <main className="main-content">
        <div className="top-header">
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <h1 className="page-title">
            {activeTab === 'create' ? 'Create Design' :
             activeTab === 'gallery' ? 'My Gallery' :
             `📿 ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`}
          </h1>
          <button
            className="btn-primary desktop-gen-btn"
            onClick={handleGenerateAll}
            disabled={loading}
            style={{visibility: activeTab === 'create' ? 'visible' : 'hidden'}}
          >
            {loading ? 'Working...' : 'Generate'}
          </button>
        </div>

        <div className="content-scroll-area">
          {error && <div className="error-banner">{error}</div>}

          {progress.total > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${(progress.current/progress.total)*100}%`}}></div>
              </div>
              <p className="progress-text">Processing {progress.current} of {progress.total}...</p>
            </div>
          )}

          {activeTab === 'create' && (
            <CreateStudio
              sketchFiles={sketchFiles}
              setSketchFiles={setSketchFiles}
              handleSketchUpload={handleSketchUpload}
              personFile={personData} 
              setPersonFile={handlePersonUpload} 
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
              handleDelete={handleDeleteGallery}
            />
          )}

          {activeTab === 'collections' && (
            <Gallery
              items={collectionsData}
              loading={loading}
              type="collection"
              handleDelete={handleDeleteCollection}
              handleUseTemplate={handleUseTemplate}
              handleUpload={handleCollectionUpload}
            />
          )}
        </div>
      </main>

      <QuickPickReel
        API_BASE_URL={API_BASE_URL}
        onSelectTemplate={handleUseTemplate}
        user={user}  // ✅ Fix: Passed user prop for auth
      />

      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        status={videoStatus}
        result={videoResult}
        logs={videoLogs}
        prompt={videoPrompt}
        setPrompt={setVideoPrompt}
        startGeneration={startVideoGeneration}
      />

      <LogoModal
        isOpen={logoModalOpen}
        onClose={() => setLogoModalOpen(false)}
        currentLogoUrl={logoUrl}
        onUpload={handleLogoUpload}
        onRemove={handleLogoRemove}
        uploading={uploadingLogo}
      />
    </div>
  );
}

export default App;