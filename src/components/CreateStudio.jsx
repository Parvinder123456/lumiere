import React, { useState } from 'react';
import CameraModal from './CameraModal';
import QRUploadModal from './QRUploadModal';

export default function CreateStudio({
  sketchFiles,
  setSketchFiles,
  handleSketchUpload,  // 👈 CRITICAL: Processes files immediately
  personFile,
  setPersonFile,
  customPrompt,
  setCustomPrompt,
  mode,
  setMode,
  metalType,
  setMetalType,
  gemstone,
  setGemstone,
  finish,
  setFinish,
  outfit,
  setOutfit,
  loading,
  handleGenerateAll,
  metalOptions,
  gemOptions,
  finishOptions,
  outfitOptions
}) {

  // 📸 CAMERA STATE
  const [isCamOpen, setIsCamOpen] = useState(false);
  const [camTarget, setCamTarget] = useState(null);

  // 📱 QR UPLOAD STATE
  const [isQROpen, setIsQROpen] = useState(false);

  // 🎥 OPEN CAMERA
  const openCamera = (target) => {
    setCamTarget(target);
    setIsCamOpen(true);
  };

  // 📸 HANDLE CAMERA CAPTURE - PROCESS IMMEDIATELY
  const handleCapture = async (file) => {
    console.log('📷 Camera captured:', file.name);

    if (camTarget === 'sketch') {
      // ✅ Process immediately (same as file upload)
      await handleSketchUpload([file]);
    } else if (camTarget === 'person') {
      setPersonFile(file);
    }
  };

  // 📁 FILE UPLOAD
  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleSketchUpload(files);  // ✅ Process immediately
    }
    e.target.value = '';
  };

  const removeSketch = (index) => {
    setSketchFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 📱 HANDLE PERSON IMAGE FROM QR SESSION (Try-On)
  const handleQRImage = async (base64) => {
    // Convert base64 back to a File object and set as person image
    const res = await fetch(base64);
    const blob = await res.blob();
    const file = new File([blob], `qr-tryon-${Date.now()}.jpg`, { type: 'image/jpeg' });
    await setPersonFile(file);
  };

  return (
    <div className="create-container">

      {/* 📸 CAMERA MODAL */}
      <CameraModal
        isOpen={isCamOpen}
        onClose={() => setIsCamOpen(false)}
        onCapture={handleCapture}
        mode={camTarget === 'sketch' ? 'environment' : 'user'}
      />

      {/* 📱 QR UPLOAD MODAL */}
      <QRUploadModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        onImageReceived={handleQRImage}
        userId="lumiere-user"
      />

      <div className="grid-layout">
        <div className="col-left">

          {/* SKETCHES CARD */}
          <div className="card upload-card-lg">
            <div className="card-header">
              <h3>Sketches <span className="req">*</span></h3>
            </div>

            <div className={`upload-zone ${sketchFiles.length > 0 ? 'has-files' : ''}`}>
              <input
                type="file"
                id="sketchInput"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                disabled={loading}
              />
              <label htmlFor="sketchInput">
                {sketchFiles.length === 0 && <span className="upload-icon-lg">✏️</span>}
                <div>{sketchFiles.length > 0 ? 'Add more sketches...' : 'Click to Upload Sketches'}</div>
              </label>
            </div>

            {/* 📸 UPLOAD BUTTONS */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-upload-sm"
                onClick={() => document.getElementById('sketchInput').click()}
                type="button"
                disabled={loading}
              >
                📁 Upload Files
              </button>
              <button
                className="btn-upload-sm"
                onClick={() => openCamera('sketch')}
                type="button"
                disabled={loading}
              >
                📸 Take Photo
              </button>
            </div>

            {/* FILE PREVIEW */}
            {sketchFiles.length > 0 && (
              <div className="file-list-preview" style={{ marginTop: '15px' }}>
                {sketchFiles.map((file, idx) => (
                  <div key={idx} className="file-tag">
                    <span className="truncated-text">{file.name}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '6px' }}>
                      ({(file.size / 1024).toFixed(0)}KB)
                    </span>
                    <button
                      onClick={() => removeSketch(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        padding: '0 0 0 8px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OUTFIT */}
          <div className="card">
            <h3>Matching Outfit</h3>
            <select
              className="select-input"
              value={outfit}
              onChange={(e) => setOutfit(e.target.value)}
              disabled={loading}
            >
              {outfitOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* CUSTOM PROMPT */}
          <div className="card">
            <h3>Custom Prompt</h3>
            <textarea
              className="text-input"
              placeholder="Add specific details about your design..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

        </div>

        <div className="col-right">

          {/* MODE SELECTOR */}
          <div className="card">
            <h3>Mode</h3>
            <div className="pill-group">
              <button
                className={`pill ${mode === 'product' ? 'active' : ''}`}
                onClick={() => setMode('product')}
                disabled={loading}
              >
                📸 Product
              </button>
              <button
                className={`pill ${mode === 'try_on' ? 'active' : ''}`}
                onClick={() => setMode('try_on')}
                disabled={loading}
              >
                👤 Try-On
              </button>
            </div>

            {/* PERSON IMAGE WITH CAMERA */}
            {mode === 'try_on' && (
              <div className="mini-upload" style={{ marginTop: '1rem' }}>
                <input
                  type="file"
                  id="personInput"
                  style={{ display: 'none' }}
                  onChange={(e) => setPersonFile(e.target.files[0])}
                  accept="image/*"
                />

                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn-upload-sm"
                    onClick={() => document.getElementById('personInput').click()}
                    type="button"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    📁 Gallery
                  </button>
                  <button
                    className="btn-upload-sm"
                    onClick={() => openCamera('person')}
                    type="button"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    🤳 Selfie
                  </button>
                  <button
                    className="btn-upload-sm btn-qr"
                    onClick={() => setIsQROpen(true)}
                    type="button"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    📱 QR Upload
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

          {/* METAL */}
          <div className="card">
            <h3>Metal</h3>
            <div className="grid-select">
              {metalOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`grid-btn ${metalType === opt.value ? 'selected' : ''}`}
                  onClick={() => setMetalType(opt.value)}
                  disabled={loading}
                >
                  <div className="dot" style={{ background: opt.color }}></div>
                  <span className="btn-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GEMSTONE */}
          <div className="card">
            <h3>Gemstone</h3>
            <div className="grid-select">
              {gemOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`grid-btn ${gemstone === opt.value ? 'selected' : ''}`}
                  onClick={() => setGemstone(opt.value)}
                  disabled={loading}
                >
                  <div className="dot" style={{ background: opt.color }}></div>
                  <span className="btn-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FINISH */}
          <div className="card">
            <h3>Finish</h3>
            <div className="grid-select">
              {finishOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`grid-btn ${finish === opt.value ? 'selected' : ''}`}
                  onClick={() => setFinish(opt.value)}
                  disabled={loading}
                >
                  <div className="dot" style={{ background: opt.color }}></div>
                  <span className="btn-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GENERATE BUTTON */}
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
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
