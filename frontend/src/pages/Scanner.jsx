// frontend/src/pages/Scanner.jsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { scanImage } from '../api/scanApi'

// ── Colour Palette (White & Green) ────────────────────────────────────
const C = {
  primary:        '#22c55e',
  primaryDark:    '#16a34a',
  primaryLight:   '#f0fdf4',
  bg:             '#ffffff',
  surface:        '#ffffff',
  border:         '#e5e7eb',
  text:           '#111827',
  textSecondary:  '#6b7280',
  textMuted:      '#9ca3af',
  error:          '#ef4444',
  errorLight:     '#fef2f2',
  warning:        '#f59e0b',
  darkBg:         '#f8fafc',
  darkSurface:    'rgba(255,255,255,0.96)',
}

// ── Icon helper ──────────────────────────────────────────────────────
const Svg = ({ d, d2, size = 20, stroke, strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke || 'currentColor'} strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
)

export default function Scanner() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraState, setCameraState] = useState('loading')
  const [cameraError, setCameraError] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [flash, setFlash] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)   // new state

  const startCamera = useCallback(async () => {
    try {
      setCameraState('loading')
      setCameraError(null)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', true)
        videoRef.current.setAttribute('webkit-playsinline', true)
        await videoRef.current.play()
      }

      streamRef.current = stream
      setCameraState('ready')
    } catch (err) {
      let message = 'Unable to access camera.'
      if (err.name === 'NotAllowedError') message = 'Camera permission denied.'
      else if (err.name === 'NotFoundError') message = 'No camera found.'
      else if (err.name === 'NotReadableError') message = 'Camera in use.'
      setCameraError(message)
      setCameraState('error')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        track.enabled = false
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.load()
    }

    setCameraState('off')
  }, [])

  // Exit flow with confirmation
  const handleExitClick = () => {
    setShowExitConfirm(true)
  }

  const confirmExit = () => {
    stopCamera()
    setShowExitConfirm(false)
    navigate('/')
  }

  const cancelExit = () => {
    setShowExitConfirm(false)
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopCamera()
      else startCamera()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [startCamera, stopCamera])

  const captureFrame = useCallback(() => {
    if (!videoRef.current || cameraState !== 'ready') return null
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })
  }, [cameraState])

  const handleScan = async () => {
    if (cameraState !== 'ready' || scanning) return

    setScanning(true)
    setFeedback(null)
    setFlash(true)
    setTimeout(() => setFlash(false), 120)

    const blob = await captureFrame()
    if (!blob) {
      setFeedback({ type: 'error', text: 'Could not capture image.' })
      setScanning(false)
      return
    }

    const result = await scanImage(blob)

    if (result.ok) {
      stopCamera()
      navigate('/result', { state: result.data })
      return
    }

    if (result.type === 'low_confidence') {
      setFeedback({ type: 'warn', text: `${result.confidence}% confidence — move closer and try again` })
    } else {
      setFeedback({ type: 'error', text: result.message })
    }
    setScanning(false)
  }

  const isReady = cameraState === 'ready'

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: C.bg,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes scanline{0%{top:10%}50%{top:85%}100%{top:10%}}
        @keyframes pulse-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.18);opacity:0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .scan-btn-wrap:active .scan-btn-inner{transform:scale(.93)}
        video{width:100%;height:100%;object-fit:cover;display:block}
        .safe-top{padding-top:env(safe-area-inset-top)}
        .safe-bottom{padding-bottom:env(safe-area-inset-bottom)}
      `}</style>

      {/* ── Header: Exit (left) | Logo (center) | Live indicator (right) ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        padding: 'max(14px, env(safe-area-inset-top)) 20px 14px',
        zIndex: 10,
        flexShrink: 0,
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {/* Left: Red Exit button */}
        <button
          onClick={handleExitClick}
          style={{
            background: C.error,
            border: 'none',
            color: '#fff',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all .15s',
          }}
        >
          Exit
        </button>

        {/* Center: Logo */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `linear-gradient(135deg,${C.primaryDark},${C.primary})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(34,197,94,.3)',
          }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>A</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Alescan</p>
            <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>SRP Scanner</p>
          </div>
        </div>

        {/* Right: Live status indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: C.primaryLight,
          borderRadius: 20,
          padding: '5px 12px',
          border: `1px solid rgba(34,197,94,.2)`,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isReady ? C.primary : C.textMuted,
            animation: isReady ? 'pulse-ring 1.8s ease infinite' : 'none',
          }} />
          <span style={{ fontSize: 12, color: isReady ? C.primaryDark : C.textSecondary, fontWeight: 500 }}>
            {cameraState === 'loading' ? 'Starting...' : isReady ? 'Camera live' : 'Camera off'}
          </span>
        </div>
      </header>

      {/* ── Camera view – RAW (no overlay filter) ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0, background: '#000' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Only flash overlay for photo capture, no permanent filter */}
        {flash && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.35, pointerEvents: 'none', transition: 'opacity .12s' }} />}

        {cameraState === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, background: 'rgba(255,255,255,.92)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: C.errorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.error }}>
              <Svg d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" d2="M12 9v4M12 17h.01" size={24} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Camera unavailable</p>
              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>{cameraError}</p>
              <button onClick={startCamera} style={{ background: C.primary, border: 'none', borderRadius: 20, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
            </div>
          </div>
        )}

        {isReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ position: 'relative', width: 'min(75vw, 75vh, 280px)', aspectRatio: '1/1' }}>
              {[
                { top: 0, left: 0, bt: 3, bl: 3, br: 0, bb: 0 },
                { top: 0, right: 0, bt: 3, bl: 0, br: 3, bb: 0 },
                { bottom: 0, left: 0, bt: 0, bl: 3, br: 0, bb: 3 },
                { bottom: 0, right: 0, bt: 0, bl: 0, br: 3, bb: 3 },
              ].map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 'min(20%, 28px)', height: 'min(20%, 28px)',
                  borderTopWidth: s.bt, borderLeftWidth: s.bl,
                  borderRightWidth: s.br, borderBottomWidth: s.bb,
                  borderStyle: 'solid', borderColor: C.primary, borderRadius: 3,
                  ...s,
                }} />
              ))}
              {!scanning && (
                <div style={{ position: 'absolute', left: 8, right: 8, height: 2, background: `linear-gradient(90deg,transparent,${C.primary},transparent)`, borderRadius: 2, animation: 'scanline 2.4s ease-in-out infinite' }} />
              )}
              {scanning && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 44, height: 44, border: `3px solid ${C.primaryLight}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin .75s linear infinite' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {isReady && !scanning && (
          <div style={{ position: 'absolute', bottom: 'calc(50% - min(37.5vw, 37.5vh, 140px))', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '6px 16px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, fontWeight: 500 }}>Point at the commodity and tap Scan</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        flexShrink: 0, background: C.darkSurface, backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${C.border}`,
        padding: '20px 24px max(36px, env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        boxShadow: '0 -1px 6px rgba(0,0,0,0.02)',
      }}>
        {feedback && (
          <div style={{
            width: '100%', maxWidth: 360, padding: '11px 14px', borderRadius: 12,
            background: feedback.type === 'warn' ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.12)',
            border: `1px solid ${feedback.type === 'warn' ? 'rgba(245,158,11,.4)' : 'rgba(239,68,68,.4)'}`,
            display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn .2s ease',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={feedback.type === 'warn' ? C.warning : C.error} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p style={{ fontSize: 13, color: C.text, margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{feedback.text}</p>
          </div>
        )}

        <div className="scan-btn-wrap" style={{ position: 'relative', cursor: isReady && !scanning ? 'pointer' : 'default' }} onClick={handleScan}>
          {isReady && !scanning && (
            <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `2px solid ${C.primary}`, animation: 'pulse-ring 2s ease-out infinite' }} />
          )}
          <div className="scan-btn-inner" style={{
            width: 72, height: 72, borderRadius: '50%',
            background: scanning ? C.primaryDark : C.primary,
            border: '3px solid rgba(255,255,255,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: scanning ? 'none' : '0 0 32px rgba(34,197,94,.45)',
            transition: 'all .18s', opacity: (!isReady || scanning) ? 0.7 : 1,
          }}>
            {scanning ? (
              <div style={{ width: 24, height: 24, border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .75s linear infinite' }} />
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" fill="#fff" stroke="none" />
              </svg>
            )}
          </div>
        </div>

        <p style={{ fontSize: 12, color: C.textMuted, margin: 0, fontWeight: 500 }}>
          {scanning ? 'Identifying commodity...' : isReady ? 'Tap to scan' : 'Starting camera...'}
        </p>
      </div>

      {/* ── Exit confirmation pop-up ── */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          padding: 20,
        }}
        onClick={cancelExit}  // close when clicking backdrop
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '24px 20px',
              maxWidth: 320,
              width: '100%',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              textAlign: 'center',
              animation: 'fadeIn .2s ease',
            }}
            onClick={(e) => e.stopPropagation()} // prevent backdrop close
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: C.errorLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.error,
              margin: '0 auto 16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Exit Scanner?
            </p>
            <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20, lineHeight: 1.5 }}>
              The camera will be turned off and you'll return to the home screen.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={cancelExit}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  color: C.textSecondary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmExit}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: C.error,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}