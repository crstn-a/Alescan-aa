// frontend/src/pages/Result.jsx
import { useLocation, useNavigate, Navigate } from 'react-router-dom'

const C = {
  g900:'#052e16', g800:'#14532d', g700:'#166534', g600:'#16a34a',
  g500:'#22c55e', g400:'#4ade80', g100:'#dcfce7', g50:'#f0fdf4',
  k900:'#111827', k700:'#374151', k500:'#6b7280', k400:'#9ca3af',
  k200:'#e5e7eb', k100:'#f3f4f6', k50:'#f9fafb', white:'#ffffff',
}

// ── Confidence bar ─────────────────────────────────────────────────────
function ConfBar({ pct }) {
  const color = pct >= 75 ? C.g500 : pct >= 60 ? '#fbbf24' : '#f87171'
  const bg    = pct >= 75 ? C.g100 : pct >= 60 ? '#fef3c7' : '#fee2e2'
  const label = pct >= 75 ? 'High' : pct >= 60 ? 'Medium' : 'Low'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, fontWeight:600, color:C.k500 }}>Detection confidence</span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:12, fontWeight:700, color }}>
            {pct.toFixed(1)}%
          </span>
          <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:bg, color }}>
            {label}
          </span>
        </div>
      </div>
      <div style={{ height:6, borderRadius:99, background:C.k100, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width .6s ease' }} />
      </div>
    </div>
  )
}

// ── Commodity icon map ─────────────────────────────────────────────────
const EMOJIS = {
  whole_chicken: '🐔',
  tilapia_local: '🐟',
  pork_liempo:   '🥩',
}

export default function Result() {
  const { state }  = useLocation()
  const navigate   = useNavigate()

  if (!state) return <Navigate to="/" replace />

  const { product, slug, confidence, official_srp, week_of, source } = state

  const weekLabel = week_of
    ? new Date(week_of).toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })
    : ''

  const emoji = EMOJIS[slug] || '📦'

  return (
    <div style={{
      minHeight:'100dvh', display:'flex', flexDirection:'column',
      background:C.k50,
      fontFamily:"'DM Sans',-apple-system,sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
        @keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .scan-again-btn{transition:all .15s}
        .scan-again-btn:hover{background:${C.g700}!important;box-shadow:0 6px 20px rgba(22,163,74,.4)!important}
        .back-btn:hover{background:${C.k100}!important}
      `}</style>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{
        height:60, background:C.white,
        borderBottom:`1px solid ${C.k100}`,
        display:'flex', alignItems:'center',
        padding:'0 20px', gap:12, flexShrink:0,
        boxShadow:'0 1px 4px rgba(0,0,0,.04)',
      }}>
        <button className="back-btn" onClick={() => navigate('/')} style={{
          width:34, height:34, borderRadius:9,
          background:'transparent', border:`1px solid ${C.k200}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:C.k500, cursor:'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:15, fontWeight:700, color:C.k900, margin:0 }}>Scan result</p>
          <p style={{ fontSize:11, color:C.k400, margin:0 }}>Official SRP verification</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:C.g50, borderRadius:20, padding:'5px 12px', border:`1px solid ${C.g100}` }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:C.g500 }} />
          <span style={{ fontSize:11, color:C.g700, fontWeight:600 }}>Verified</span>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main style={{ flex:1, overflowY:'auto', padding:'20px 20px 24px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Commodity card */}
        <div style={{
          background:`linear-gradient(135deg,${C.g800} 0%,${C.g700} 100%)`,
          borderRadius:18, padding:'22px 20px',
          boxShadow:'0 8px 28px rgba(22,101,52,.3)',
          animation:'scaleIn .3s ease',
          position:'relative', overflow:'hidden',
        }}>
          {/* BG circle */}
          <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,.07)' }} />
          <div style={{ position:'absolute', bottom:-30, left:-30, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,.04)' }} />

          <div style={{ display:'flex', alignItems:'flex-start', gap:16, position:'relative' }}>
            <div style={{ width:54, height:54, borderRadius:14, background:'rgba(255,255,255,.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
              {emoji}
            </div>
            <div>
              <p style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.55)', margin:'0 0 4px', letterSpacing:'.05em', textTransform:'uppercase' }}>
                Commodity identified
              </p>
              <h2 style={{ fontSize:21, fontWeight:800, color:'#fff', margin:0, lineHeight:1.2 }}>{product}</h2>
            </div>
          </div>
        </div>

        {/* SRP price card */}
        <div style={{
          background:C.white, borderRadius:18,
          border:`1px solid ${C.k100}`,
          boxShadow:'0 4px 16px rgba(0,0,0,.06)',
          padding:'22px 20px',
          animation:'fadeUp .35s .08s ease both',
        }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.k400, letterSpacing:'.07em', textTransform:'uppercase', margin:'0 0 8px' }}>
            Official SRP — DA Bantay Presyo
          </p>
          <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
            <span style={{ fontSize:20, fontWeight:700, color:C.g700 }}>₱</span>
            <span style={{
              fontSize:52, fontWeight:800, color:C.g700, lineHeight:1,
              fontVariantNumeric:'tabular-nums',
              animation:'countUp .4s .15s ease both',
            }}>
              {Number(official_srp).toFixed(2)}
            </span>
          </div>
          <p style={{ fontSize:13, color:C.k400, margin:'6px 0 0' }}>per kilogram</p>
        </div>

        {/* Confidence */}
        <div style={{
          background:C.white, borderRadius:16,
          border:`1px solid ${C.k100}`,
          padding:'18px 20px',
          animation:'fadeUp .35s .14s ease both',
        }}>
          <ConfBar pct={confidence} />
        </div>

        {/* Source info */}
        <div style={{
          background:C.white, borderRadius:16,
          border:`1px solid ${C.k100}`,
          padding:'16px 18px',
          display:'flex', alignItems:'center', gap:14,
          animation:'fadeUp .35s .2s ease both',
        }}>
          <div style={{ width:40, height:40, borderRadius:10, background:C.g50, display:'flex', alignItems:'center', justifyContent:'center', color:C.g600, flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:600, color:C.k900, margin:0 }}>{source}</p>
            <p style={{ fontSize:12, color:C.k400, margin:'2px 0 0' }}>Week of {weekLabel}</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, background:C.g50, borderRadius:20, padding:'4px 10px', flexShrink:0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.g600} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize:11, fontWeight:700, color:C.g700 }}>Official</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          display:'flex', gap:10, padding:'12px 16px',
          background:C.k50, borderRadius:12,
          border:`1px solid ${C.k100}`,
          animation:'fadeUp .35s .26s ease both',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.k400} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ fontSize:12, color:C.k500, margin:0, lineHeight:1.6 }}>
            This price is a government reference only. Actual market prices may vary. Report discrepancies to your local DA office.
          </p>
        </div>

        <div style={{ flex:1 }} />
      </main>

      {/* ── Bottom action ─────────────────────────────────────────── */}
      <div style={{
        flexShrink:0, padding:'16px 20px 32px',
        background:C.white, borderTop:`1px solid ${C.k100}`,
        boxShadow:'0 -4px 16px rgba(0,0,0,.04)',
      }}>
        <button className="scan-again-btn" onClick={() => navigate('/scanner')} style={{
          width:'100%', padding:'14px', borderRadius:12,
          border:'none', background:C.g600, color:'#fff',
          fontSize:15, fontWeight:700, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          boxShadow:'0 4px 16px rgba(22,163,74,.35)',
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <circle cx="12" cy="12" r="3.5" fill="#fff" stroke="none"/>
          </svg>
          Scan another commodity
        </button>
      </div>
    </div>
  )
}