import { useLocation, useNavigate, Navigate } from 'react-router-dom'

export default function Result() {
  const { state } = useLocation()
  const navigate  = useNavigate()

  if (!state) return <Navigate to="/" replace />

  const { product, confidence, official_srp, week_of, source } = state

  const weekLabel = week_of
    ? `Week of ${new Date(week_of).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : ''

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#111' }}>

      <header style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/')}
          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>Scan result</h1>
      </header>

      <main style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Commodity name + confidence badge */}
        <div style={{ background: 'rgba(29,158,117,0.1)', border: '0.5px solid rgba(29,158,117,0.25)',
          borderRadius: 14, padding: 16 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 4px',
            letterSpacing: '0.05em', textTransform: 'uppercase' }}>Commodity identified</p>
          <p style={{ color: '#fff', fontSize: 22, fontWeight: 500, margin: '0 0 8px' }}>
            {product}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(29,158,117,0.2)', borderRadius: 20, padding: '3px 10px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ color: '#1D9E75', fontSize: 12 }}>
              {confidence.toFixed(1)}% confidence
            </span>
          </span>
        </div>

        {/* Official SRP — largest element on screen */}
        <div style={{ background: '#1a1a1a', borderRadius: 14, padding: '20px 16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '0 0 4px',
            letterSpacing: '0.05em', textTransform: 'uppercase' }}>Official SRP</p>
          <p style={{ color: '#1D9E75', fontSize: 42, fontWeight: 500, lineHeight: 1.1, margin: 0 }}>
            ₱{Number(official_srp).toFixed(2)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '4px 0 0' }}>
            per kilogram
          </p>
        </div>

        {/* Source attribution */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
          background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ width: 16, height: 16, background: 'rgba(255,255,255,0.15)',
            borderRadius: 4, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              {source}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
              {weekLabel}
            </p>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Scan another button */}
        <button
          onClick={() => navigate('/')}
          style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none',
            background: '#1D9E75', color: '#fff', fontSize: 15, fontWeight: 500,
            cursor: 'pointer', marginBottom: 16 }}>
          Scan another
        </button>
      </main>
    </div>
  )
}