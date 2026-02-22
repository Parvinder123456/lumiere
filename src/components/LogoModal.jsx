import React, { useState } from 'react';

export default function LogoModal({ 
  isOpen, 
  onClose, 
  currentLogoUrl, 
  onUpload, 
  onRemove,
  uploading 
}) {
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo must be under 5MB');
      return;
    }

    setSelectedFile(file);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const handleCancel = () => {
    setPreviewImage(null);
    setSelectedFile(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window logo-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h3>Manage Brand Logo</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="logo-modal-content">
          
          {/* Current Logo Section */}
          <div className="logo-section">
            <h4>Current Logo</h4>
            {currentLogoUrl ? (
              <div className="logo-preview-card">
                <img src={currentLogoUrl} alt="Current logo" className="logo-preview-img" />
                <button 
                  className="btn-danger-small" 
                  onClick={onRemove}
                  disabled={uploading}
                >
                  🗑️ Remove Logo
                </button>
              </div>
            ) : (
              <div className="logo-empty-state">
                <span className="logo-empty-icon">📷</span>
                <p>No logo uploaded yet</p>
              </div>
            )}
          </div>

          {/* Upload New Logo Section */}
          <div className="logo-section">
            <h4>Upload New Logo</h4>
            
            {!previewImage ? (
              <div className="logo-upload-zone">
                <input 
                  type="file" 
                  id="logoFileInput" 
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <label htmlFor="logoFileInput" className="logo-upload-label">
                  <span className="upload-icon-lg">📤</span>
                  <span>Click to select logo</span>
                  <span className="upload-hint">PNG or JPG • Max 5MB • Transparent background recommended</span>
                </label>
              </div>
            ) : (
              <div className="logo-preview-card">
                <img src={previewImage} alt="New logo preview" className="logo-preview-img" />
                <div className="logo-actions">
                  <button 
                    className="btn-secondary-small" 
                    onClick={handleCancel}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary-small" 
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : '✓ Save Logo'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="logo-info">
            <p>💡 <strong>Tip:</strong> Your logo will be automatically applied to all generated jewelry images.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
