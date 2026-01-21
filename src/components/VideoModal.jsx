import React from 'react';

// 👇 Verify this line
export default function VideoModal({ 
    isOpen, onClose, 
    status, result, logs, 
    prompt, setPrompt, 
    startGeneration 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
        <div className="modal-window">
            <div className="modal-header">
                <h3>AI Video Studio</h3>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>
            
            {status === 'prompt' && (
                <div className="video-prompt-container">
                    <textarea 
                        className="text-input" 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)} 
                        style={{ minHeight: '120px' }} 
                        placeholder="Describe the camera movement..."
                    />
                    <button className="btn-primary" onClick={startGeneration} style={{marginTop:'0.5rem'}}>✨ Start Generation</button>
                </div>
            )}

            {status !== 'prompt' && (
                <>
                <div className="video-display">
                    {status === 'completed' && result ? (
                        <div className="video-success-container">
                            <video src={result} controls autoPlay loop className="final-video" />
                        </div>
                    ) : (
                        <div className="video-loader">
                            <div className="spinner-ring"></div>
                            <h4>{status === 'processing' ? 'Generating Video...' : 'Queued...'}</h4>
                        </div>
                    )}
                </div>
                <div className="terminal-logs">
                    {logs.map((log, i) => (
                        <div key={i} className={`log-line ${log.type}`}>[{log.time}] {log.message}</div>
                    ))}
                </div>
                </>
            )}
        </div>
    </div>
  );
}