import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../firebase';
import {
    doc,
    setDoc,
    onSnapshot,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';

// Generate a random session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export default function QRUploadModal({ isOpen, onClose, onImageReceived, userId }) {
    const [sessionId] = useState(() => generateSessionId());
    const [status, setStatus] = useState('waiting'); // 'waiting' | 'received' | 'error'
    const [dot, setDot] = useState(0);
    const unsubRef = useRef(null);
    const docRef = useRef(null);

    const uploadUrl = `${window.location.origin}/mobile-upload?session=${sessionId}&uid=${userId}`;

    useEffect(() => {
        if (!isOpen) return;

        const sessionDocRef = doc(db, 'qr_sessions', sessionId);
        docRef.current = sessionDocRef;

        // Create session document in Firestore
        setDoc(sessionDocRef, {
            status: 'waiting',
            userId: userId,
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min TTL
        }).catch(err => {
            console.error('Failed to create QR session:', err);
            setStatus('error');
        });

        // Listen for image upload
        unsubRef.current = onSnapshot(sessionDocRef, (snap) => {
            const data = snap.data();
            if (data?.status === 'uploaded' && data?.imageBase64) {
                setStatus('received');
                // Short delay to show success state before closing
                setTimeout(() => {
                    onImageReceived(data.imageBase64);
                    cleanup();
                    onClose();
                }, 1200);
            }
        });

        // Animated dots
        const dotInterval = setInterval(() => setDot(d => (d + 1) % 4), 500);

        return () => {
            clearInterval(dotInterval);
        };
    }, [isOpen]);

    const cleanup = () => {
        if (unsubRef.current) unsubRef.current();
        if (docRef.current) deleteDoc(docRef.current).catch(() => { });
    };

    const handleClose = () => {
        cleanup();
        onClose();
    };

    if (!isOpen) return null;

    const dots = '.'.repeat(dot + 1).padEnd(3, '\u00A0');

    return (
        <div className="qr-modal-overlay" onClick={handleClose}>
            <div
                className="qr-modal-box"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="qr-modal-header">
                    <div className="qr-modal-title">
                        <span className="qr-title-icon">📱</span>
                        <h2>Upload via Phone</h2>
                    </div>
                    <button className="qr-close-btn" onClick={handleClose}>✕</button>
                </div>

                {status === 'received' ? (
                    /* SUCCESS STATE */
                    <div className="qr-success-state">
                        <div className="qr-success-icon">✅</div>
                        <p className="qr-success-text">Photo received!</p>
                        <p className="qr-success-sub">Adding to your sketches…</p>
                    </div>
                ) : status === 'error' ? (
                    /* ERROR STATE */
                    <div className="qr-success-state">
                        <div className="qr-success-icon">❌</div>
                        <p className="qr-success-text">Connection error</p>
                        <p className="qr-success-sub">Please check Firebase Firestore is enabled.</p>
                    </div>
                ) : (
                    /* WAITING STATE */
                    <>
                        <p className="qr-instruction">
                            Ask your customer to scan this QR code with their phone
                        </p>

                        {/* QR Code */}
                        <div className="qr-code-wrapper">
                            <div className="qr-code-border">
                                <QRCodeSVG
                                    value={uploadUrl}
                                    size={200}
                                    bgColor="#ffffff"
                                    fgColor="#1e293b"
                                    level="M"
                                    includeMargin={true}
                                />
                            </div>
                            <div className="qr-corner qr-tl" />
                            <div className="qr-corner qr-tr" />
                            <div className="qr-corner qr-bl" />
                            <div className="qr-corner qr-br" />
                        </div>

                        {/* Pulsing status */}
                        <div className="qr-waiting-row">
                            <span className="qr-pulse-dot" />
                            <span className="qr-waiting-text">Waiting for photo{dots}</span>
                        </div>

                        {/* Divider */}
                        <div className="qr-divider">
                            <span>or open link manually</span>
                        </div>

                        {/* Copyable URL */}
                        <div className="qr-url-row">
                            <input
                                className="qr-url-input"
                                readOnly
                                value={uploadUrl}
                                onClick={e => e.target.select()}
                            />
                            <button
                                className="qr-copy-btn"
                                onClick={() => navigator.clipboard?.writeText(uploadUrl)}
                                title="Copy link"
                            >
                                📋
                            </button>
                        </div>

                        <p className="qr-expire-note">Link expires in 10 minutes</p>
                    </>
                )}
            </div>
        </div>
    );
}
