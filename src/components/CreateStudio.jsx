import React, { useState } from 'react';
import CameraModal from './CameraModal';

export default function CreateStudio({ 
  sketchFiles, setSketchFiles, 
  personFile, setPersonFile, 
  logoFile, setLogoFile, 
  customPrompt, setCustomPrompt,
  mode, setMode,
  metalType, setMetalType,
  gemstone, setGemstone,
  finish, setFinish,
  outfit, setOutfit,
  loading, handleGenerateAll,
  metalOptions, gemOptions, finishOptions, outfitOptions
}) {

  // 📸 Camera State
  const [isCamOpen, setIsCamOpen] = useState(false);
  const [camTarget, setCamTarget] = useState(null);

  // 🎥 Open Camera
  const openCamera = (target) => {
    setCamTarget(target);
    setIsCamOpen(true);
    console.log('📸 Opening camera for:', target);
  };

  // 📸 Handle Capture
  const handleCapture = (file) => {
    console.log('📷 Photo captured:', file.name);
    
    if (camTarget === 'sketch') {
      setSketchFiles(prev => [...prev, file]);
      console.log('✅ Sketch added');
    } else if (camTarget === 'person') {
      setPersonFile(file);
      console.log('✅ Person photo set');
    }
  };

  // 📁 File Handlers
  const handleSketchUpload = (e) => setSketchFiles(prev => [...prev, ...Array.from(e.target.files)]);
  const removeSketch = (idx) => setSketchFiles(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="create-container">
      
      {/* 📸 CAMERA MODAL */}
      <CameraModal 
        isOpen={isCamOpen} 
        onClose={() => setIsCamOpen(false)} 
        onCapture={handleCapture}
        mode={camTarget === 'sketch' ? 'environment' : 'user'}
      />

      <div className="grid-layout">
        <div className="col-left">
          
          {/* SKETCH UPLOAD - YOUR ORIGINAL DESIGN */}
          <div className="card upload-card-lg">
            <div className="card-header"><h3>Sketches <span className="req">*</span></h3></div>
            
            <div className={`upload-zone ${sketchFiles.length > 0 ? 'has-files' : ''}`}>
              <input 
                type="file" 
                id="sketchInput"
                multiple 
                onChange={handleSketchUpload} 
              />
              <label>
                  {sketchFiles.length === 0 && <div className="upload-icon-lg">✏️</div>}
                  <span>{sketchFiles.length > 0 ? 'Add more sketches...' : 'Click to Upload Sketches'}</span>
              </label>
            </div>

            {/* 📸 CAMERA BUTTON - ADDED BELOW UPLOAD ZONE */}
            <div style={{display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center'}}>
              <button 
                className="btn-upload-sm" 
                onClick={() => document.getElementById('sketchInput').click()}
                type="button"
              >
                📁 Upload Files
              </button>
              <button 
                className="btn-upload-sm" 
                onClick={() => openCamera('sketch')}
                type="button"
              >
                📸 Take Photo
              </button>
            </div>

            {/* FILE PREVIEW - YOUR ORIGINAL DESIGN */}
            {sketchFiles.length > 0 && (
              <div className="file-list-preview" style={{marginTop:'15px'}}>
                {sketchFiles.map((f, i) => (
                  <div key={i} className="file-tag">
                    <span className="truncated-text">{f.name}</span>
                    <span 
                      onClick={(e) => {e.preventDefault(); removeSketch(i);}} 
                      style={{cursor:'pointer', color:'#ef4444', marginLeft:'8px', fontWeight:'bold'}}
                    >
                      ✕
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOGO - YOUR ORIGINAL DESIGN */}
          <div className="card">
            <h3>Brand Logo</h3>
            <div className="mini-upload">
              <input 
                type="file" 
                id="logoInput"
                onChange={e=>setLogoFile(e.target.files[0])} 
              />
              <label>{logoFile ? `✅ ${logoFile.name}` : 'Upload PNG'}</label>
            </div>
          </div>

          {/* OUTFIT - YOUR ORIGINAL DESIGN */}
          <div className="card">
            <h3>Matching Outfit</h3>
            <select 
              className="select-input" 
              value={outfit} 
              onChange={(e) => setOutfit(e.target.value)}
            >
              {outfitOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* PROMPT - YOUR ORIGINAL DESIGN */}
          <div className="card">
            <h3>Custom Prompt</h3>
            <textarea 
              className="text-input" 
              value={customPrompt} 
              onChange={e => setCustomPrompt(e.target.value)} 
              placeholder="Details..." 
            />
          </div>
        </div>
        
        <div className="col-right">
          
          {/* MODE - YOUR ORIGINAL DESIGN */}
          <div className="card">
            <h3>Mode</h3>
            <div className="pill-group">
              <button 
                className={`pill ${mode==='product'?'active':''}`} 
                onClick={()=>setMode('product')}
              >
                📸 Product
              </button>
              <button 
                className={`pill ${mode==='try_on'?'active':''}`} 
                onClick={()=>setMode('try_on')}
              >
                👤 Try-On
              </button>
            </div>

            {/* PERSON IMAGE WITH CAMERA - MODIFIED */}
            {mode === 'try_on' && (
              <div className="mini-upload" style={{marginTop: '1rem'}}>
                <input 
                  type="file" 
                  id="personInput"
                  style={{display: 'none'}}
                  onChange={e=>setPersonFile(e.target.files[0])} 
                />
                
                {/* Camera + Upload Buttons */}
                <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
                  <button 
                    className="btn-upload-sm" 
                    onClick={() => document.getElementById('personInput').click()}
                    type="button"
                    style={{flex: 1}}
                  >
                    📁 Gallery
                  </button>
                  <button 
                    className="btn-upload-sm" 
                    onClick={() => openCamera('person')}
                    type="button"
                    style={{flex: 1}}
                  >
                    🤳 Selfie
                  </button>
                </div>

                {personFile && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: '#d1fae5',
                    color: '#065f46',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}>
                    ✅ {personFile.name}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* METAL - YOUR ORIGINAL DESIGN */}
          <div className="card">
            <h3>Metal</h3>
            <div className="grid-select">
              {metalOptions.map(opt => (
                <button 
                  key={opt.value} 
                  className={`grid-btn ${metalType===opt.value?'selected':''}`} 
                  onClick={()=>setMetalType(opt.value)}
                >
                  <span 
                    className="dot" 
                    style={{
                      background:opt.color, 
                      border: opt.value==='none'?'1px dashed #ccc':'none'
                    }}
                  ></span>
                  <span className="btn-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GEMSTONE - YOUR ORIGINAL DESIGN */}
          <div className="card">
            <h3>Gemstone</h3>
            <div className="grid-select">
              {gemOptions.map(opt => (
                <button 
                  key={opt.value} 
                  className={`grid-btn ${gemstone===opt.value?'selected':''}`} 
                  onClick={()=>setGemstone(opt.value)}
                >
                  <span className="dot" style={{background:opt.color}}></span>
                  <span className="btn-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FINISH - YOUR ORIGINAL DESIGN */}
          <div className="card">
            <h3>Finish</h3>
            <div className="grid-select">
              {finishOptions.map(opt => (
                <button 
                  key={opt.value} 
                  className={`grid-btn ${finish === opt.value ? 'selected' : ''}`} 
                  onClick={() => setFinish(opt.value)}
                >
                  <span className="dot" style={{background: opt.color}}></span>
                  <span className="btn-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* GENERATE BUTTON - YOUR ORIGINAL DESIGN */}
          <button 
            className="btn-primary" 
            style={{width:'100%', marginTop:'1rem'}} 
            onClick={handleGenerateAll} 
            disabled={loading}
          >
            {loading ? 'Working...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
