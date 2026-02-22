import { useState, useRef, useEffect } from 'react';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Inline image compression (no import needed from App.jsx)
const compressMobileImage = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) { reject(new Error('No file')); return; }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Failed to load image'));
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const MAX = 700;
                if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
                if (height > 1000) { width = Math.round((width * 1000) / height); height = 1000; }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.72));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

export default function MobileUpload() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');

    const [phase, setPhase] = useState('idle'); // idle | processing | done | error
    const [errorMsg, setErrorMsg] = useState('');
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Block if no session
    useEffect(() => {
        if (!sessionId) setPhase('error'), setErrorMsg('No session ID found in URL. Please scan the QR code again.');
    }, [sessionId]);

    const handleFile = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setErrorMsg('Please select an image file.');
            return;
        }
        setPhase('processing');
        setErrorMsg('');

        try {
            // Show local preview
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            const base64 = await compressMobileImage(file);

            // Write to Firestore session doc
            const sessionDocRef = doc(db, 'qr_sessions', sessionId);
            await updateDoc(sessionDocRef, {
                status: 'uploaded',
                imageBase64: base64,
                uploadedAt: new Date().toISOString()
            });

            setPhase('done');
        } catch (err) {
            console.error('Upload error:', err);
            setPhase('error');
            setErrorMsg(err.message || 'Upload failed. Please try again.');
        }
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    return (
        <div style={styles.page}>
            {/* Background blobs */}
            <div style={styles.blob1} />
            <div style={styles.blob2} />

            <div style={styles.card}>
                {/* Logo / brand */}
                <div style={styles.brandRow}>
                    <span style={styles.brandGem}>💎</span>
                    <span style={styles.brandName}>Lumière</span>
                </div>

                {phase === 'done' ? (
                    /* ── SUCCESS ── */
                    <div style={styles.centerCol}>
                        <div style={styles.successRing}>
                            <span style={styles.successIcon}>✅</span>
                        </div>
                        <h2 style={styles.heading}>Photo Sent!</h2>
                        <p style={styles.sub}>Your jeweler received your photo.<br />You can close this tab.</p>
                        {preview && (
                            <img src={preview} alt="Uploaded" style={styles.thumbImg} />
                        )}
                    </div>
                ) : phase === 'error' ? (
                    /* ── ERROR ── */
                    <div style={styles.centerCol}>
                        <div style={{ ...styles.successRing, background: 'rgba(239,68,68,0.12)' }}>
                            <span style={styles.successIcon}>❌</span>
                        </div>
                        <h2 style={styles.heading}>Something went wrong</h2>
                        <p style={styles.sub}>{errorMsg}</p>
                    </div>
                ) : phase === 'processing' ? (
                    /* ── PROCESSING ── */
                    <div style={styles.centerCol}>
                        {preview && <img src={preview} alt="Preview" style={styles.thumbImg} />}
                        <div style={styles.spinner} />
                        <p style={styles.sub}>Sending to jeweler…</p>
                    </div>
                ) : (
                    /* ── IDLE ── */
                    <>
                        <h2 style={styles.heading}>Upload Your Photo</h2>
                        <p style={styles.sub}>
                            Your jeweler needs a photo.<br />Choose how you'd like to send it:
                        </p>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={handleInputChange}
                        />
                        <input
                            id="galleryInput"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleInputChange}
                        />

                        {/* Buttons */}
                        <div style={styles.btnGroup}>
                            <button
                                style={styles.btnCamera}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span style={styles.btnIcon}>📸</span>
                                <span>Take Photo</span>
                            </button>

                            <button
                                style={styles.btnGallery}
                                onClick={() => document.getElementById('galleryInput').click()}
                            >
                                <span style={styles.btnIcon}>🖼️</span>
                                <span>Choose from Gallery</span>
                            </button>
                        </div>

                        <p style={styles.secureNote}>🔒 Your photo is sent securely and deleted automatically</p>
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Inline styles for standalone mobile page ── */
const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        position: 'relative',
        overflow: 'hidden'
    },
    blob1: {
        position: 'absolute', top: '-120px', right: '-80px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
        pointerEvents: 'none'
    },
    blob2: {
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
        pointerEvents: 'none'
    },
    card: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '24px',
        padding: '36px 28px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 1
    },
    brandRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', marginBottom: '28px'
    },
    brandGem: { fontSize: '1.8rem' },
    brandName: {
        fontSize: '1.5rem', fontWeight: '700',
        background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
    },
    heading: {
        color: '#f1f5f9', fontSize: '1.5rem', fontWeight: '700',
        textAlign: 'center', margin: '0 0 10px 0'
    },
    sub: {
        color: '#94a3b8', fontSize: '0.95rem', textAlign: 'center',
        lineHeight: '1.6', margin: '0 0 28px 0'
    },
    centerCol: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '14px'
    },
    successRing: {
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(34,197,94,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    successIcon: { fontSize: '2.4rem' },
    thumbImg: {
        width: '100%', maxWidth: '260px', borderRadius: '12px',
        border: '2px solid rgba(255,255,255,0.12)',
        objectFit: 'cover', maxHeight: '220px'
    },
    spinner: {
        width: '44px', height: '44px', borderRadius: '50%',
        border: '3px solid rgba(167,139,250,0.2)',
        borderTop: '3px solid #a78bfa',
        animation: 'spin 0.9s linear infinite'
    },
    btnGroup: {
        display: 'flex', flexDirection: 'column', gap: '14px', width: '100%'
    },
    btnCamera: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', width: '100%', padding: '16px',
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        border: 'none', borderRadius: '14px', color: '#fff',
        fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
        transition: 'transform 0.15s, box-shadow 0.15s'
    },
    btnGallery: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', width: '100%', padding: '16px',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '14px', color: '#e2e8f0',
        fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer',
        transition: 'transform 0.15s, background 0.15s'
    },
    btnIcon: { fontSize: '1.3rem' },
    secureNote: {
        color: '#475569', fontSize: '0.78rem', textAlign: 'center',
        margin: '20px 0 0 0'
    }
};
