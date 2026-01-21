import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

export default function CameraModal({ isOpen, onClose, onCapture, mode = 'user' }) {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  // 'user' = Front Cam, 'environment' = Back Cam
  const [cameraFacing, setCameraFacing] = useState(mode); 

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, [webcamRef]);

  const retake = () => setImgSrc(null);

  const confirm = () => {
    fetch(imgSrc)
      .then(res => res.blob())
      .then(blob => {
        // Create a proper File object to match what <input type="file"> produces
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        setImgSrc(null);
        onClose();
      });
  };

  const toggleCamera = () => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  return (
    <div className="camera-overlay">
      <div className="camera-window">
        
        {/* HEADER */}
        <div className="camera-header">
            <span>{imgSrc ? 'Review Photo' : 'Take Photo'}</span>
            <button className="close-btn-cam" onClick={onClose}>✕</button>
        </div>

        {/* VIEWPORT */}
        <div className="camera-viewport">
          {imgSrc ? (
            <img src={imgSrc} alt="captured" className="captured-preview" />
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: cameraFacing,
                aspectRatio: window.innerWidth < 768 ? 9/16 : 16/9
              }}
              className="webcam-feed"
              mirrored={cameraFacing === 'user'}
            />
          )}
        </div>

        {/* CONTROLS */}
        <div className="camera-controls">
          {imgSrc ? (
            <div className="review-actions">
              <button className="cam-btn secondary" onClick={retake}>🔄 Retake</button>
              <button className="cam-btn primary" onClick={confirm}>✅ Use Photo</button>
            </div>
          ) : (
            <div className="capture-actions">
              <button className="flip-btn" onClick={toggleCamera}>
                📷 <span>Flip</span>
              </button>
              
              <button className="shutter-btn" onClick={capture}></button>
              
              <div className="spacer"></div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}