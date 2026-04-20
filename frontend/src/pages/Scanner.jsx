import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCamera } from '../hooks/useCamera'
import { scanImage } from '../api/scanApi'

export default function Scanner() {
  const navigate = useNavigate()
  const { videoRef, ready, error: camError, startCamera, stopCamera, captureFrame }
    = useCamera()

  const [scanning, setScanning] = useState(false)
  const [feedback, setFeedback] = useState(null)  // error message shown under viewfinder

  useEffect(() => { startCamera() }, [startCamera])

  async function handleScan() {
    if (!ready || scanning) return
    setScanning(true)
    setFeedback(null)

    const blob = await captureFrame()
    if (!blob) { setScanning(false); return }

    const result = await scanImage(blob)

    if (result.ok) {
      stopCamera()
      navigate('/result', { state: result.data })
      return
    }

    // Show inline feedback for retryable errors
    if (result.type === 'low_confidence') {
      setFeedback(`${result.confidence}% confidence — move closer and try again`)
    } else {
      setFeedback(result.message)
    }
    setScanning(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#111' }}>

      <header style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, background: '#1D9E75', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>A</span>
        </div>
        <h1 style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>Alescan</h1>
      </header>

      <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>

        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
        />

        /* Viewfinder overlay — corner brackets + scan line */
        <ViewfinderOverlay scanning={scanning} />

        /* Camera permission error */
        {camError && (
          <div style={{ position: 'absolute', padding: '16px 24px', background: '#1a1a1a',
            borderRadius: 12, color: '#fff', fontSize: 14, textAlign: 'center', maxWidth: 280 }}>
            <p>{camError}</p>
          </div>
        )}
      </div>

      <footer style={{ background: '#111', padding: '20px 20px 36px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

        {feedback && (
          <p style={{ color: '#EF9F27', fontSize: 13, textAlign: 'center', margin: 0 }}>
            {feedback}
          </p>
        )}

        <button
          onClick={handleScan}
          disabled={!ready || scanning}
          style={{
            width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: scanning ? '#0F6E56' : '#1D9E75',
            opacity: (!ready || scanning) ? 0.6 : 1,
            transition: 'all .2s',
          }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)',
            margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {scanning
              ? <span style={{ color: '#fff', fontSize: 11 }}>...</span>
              : <CameraIcon />
            }
          </div>
        </button>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
          {scanning ? 'Identifying commodity...' : 'Tap to scan'}
        </p>
      </footer>
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────────────── */

function ViewfinderOverlay({ scanning }) {
  const c = '#1D9E75'
  const sz = 180
  const arm = 24
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ position: 'relative', width: sz, height: sz }}>
        {/* Four corner L-shapes */}
        {[
          { top: 0, left: 0,  bt: 2, bl: 2, br: 0, bb: 0 },
          { top: 0, right: 0, bt: 2, bl: 0, br: 2, bb: 0 },
          { bottom: 0, left: 0,  bt: 0, bl: 2, br: 0, bb: 2 },
          { bottom: 0, right: 0, bt: 0, bl: 0, br: 2, bb: 2 },
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', width: arm, height: arm,
            borderTopWidth: s.bt, borderLeftWidth: s.bl,
            borderRightWidth: s.br, borderBottomWidth: s.bb,
            borderStyle: 'solid', borderColor: c,
            borderRadius: 3, ...s,
          }} />
        ))}
        
        {scanning && (
          <div style={{ position: 'absolute', left: 8, right: 8,
            height: 1, background: c, opacity: 0.7, top: '50%' }} />
        )}
      </div>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  )
}