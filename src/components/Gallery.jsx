import React, { useRef, useState } from 'react';

export default function Gallery({ 
  items, 
  loading, 
  type, 
  handleGenerateVideo, 
  handleDelete, 
  handleUseTemplate,
  handleUpload
}) {
  
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Debug logging
      console.log('📁 Files selected:', files.length);
      files.forEach((f, i) => {
          console.log(`File ${i}:`, {
              name: f.name,
              type: f.type,
              size: f.size,
              valid: f instanceof File
          });
      });
      
      // Validate files have type property
      const filesWithType = files.filter(f => f && f.type);
      if (filesWithType.length === 0) {
          alert('Invalid file selection. Please try again.');
          e.target.value = '';
          return;
      }
      
      const invalidFiles = filesWithType.filter(f => !f.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        alert('Please upload only image files (JPG, PNG, etc.)');
        e.target.value = '';
        return;
      }
      
      const largeFiles = filesWithType.filter(f => f.size > 10 * 1024 * 1024);
      if (largeFiles.length > 0) {
        alert(`${largeFiles.length} file(s) too large! Please upload images under 10MB each.`);
        e.target.value = '';
        return;
      }
      
      setUploading(true);
      setUploadProgress({ current: 0, total: filesWithType.length });
      
      try {
        await handleUpload(filesWithType, setUploadProgress);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
      } finally {
        setUploading(false);
        setUploadProgress({ current: 0, total: 0 });
        e.target.value = '';
      }
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="empty-state">
        <div className="spinner-ring"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-grid">
        
        {type === 'collection' && (
          <div 
            className={`gallery-card upload-card ${uploading ? 'uploading' : ''}`}
            onClick={() => !uploading && fileInputRef.current.click()}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && !uploading && fileInputRef.current.click()}
            aria-label="Add images to collection"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{display:'none'}} 
              accept="image/*" 
              multiple
              onChange={onFileChange}
              disabled={uploading}
            />
            <div className="upload-content">
              {uploading ? (
                <>
                  <div className="spinner-ring"></div>
                  <span>Uploading {uploadProgress.current}/{uploadProgress.total}...</span>
                </>
              ) : (
                <>
                  <span className="upload-icon-plus">+</span>
                  <span>Add to Collection</span>
                </>
              )}
            </div>
          </div>
        )}

        {(!items || items.length === 0) && type !== 'collection' && (
           <div className="empty-state">
             <h3>Nothing here yet</h3>
           </div>
        )}

        {items && items.map((img, idx) => (
          <div key={img.id || idx} className="gallery-card">
            <div className="img-wrapper">
                <img 
                    src={img.thumbnail || img.imageUrl || img.url} 
                    alt={img.name || `Design ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (img.url && e.target.src !== img.url) {
                        e.target.src = img.url;
                      } else if (img.imageUrl && e.target.src !== img.imageUrl) {
                        e.target.src = img.imageUrl;
                      }
                    }}
                />
                
                <div className="overlay">
                    {type === 'user' && (
                        <>
                            <button 
                                className="icon-btn" 
                                onClick={() => handleGenerateVideo(img)} 
                                title="Create Video"
                            >
                                🎬
                            </button>
                            <a 
                                href={img.imageUrl || img.url} 
                                download={img.name || 'jewelry-design.jpg'}
                                className="icon-btn" 
                                title="Download"
                            >
                                ⬇️
                            </a>
                            <button 
                                className="delete-btn-gallery" 
                                onClick={(e) => handleDelete(e, img.id)}
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </>
                    )}
                    
                    {type === 'collection' && (
                        <>
                            <button 
                                className="btn-primary" 
                                onClick={() => handleUseTemplate(img.url, img.name)}
                            >
                                ✨ Use
                            </button>
                            <button 
                                className="delete-btn-gallery" 
                                onClick={(e) => handleDelete(e, img.id)}
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="card-info">
                <h4>{img.name || `Design ${idx + 1}`}</h4>
                {img.createdAt && (
                    <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
