// frontend/src/pages/AdminDashboard.jsx
// ⚠️  Place Alescan-Logo.png in your /public folder

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'
import {
  getStats, getScanLogs, getSyncLogs,
  getErrorLogs, getPriceRecords, triggerSync,
} from '../api/adminApi'

/* ── Icons ──────────────────────────────────────────────────────────── */
const Svg = ({ d, d2, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
)
const IC = {
  home:    { d:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", d2:"M9 22V12h6v10" },
  scan:    { d:"M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M8 12h8M12 8v8" },
  price:   { d:"M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  sync:    { d:"M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" },
  alert:   { d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" },
  logout:  { d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" },
  refresh: { d:"M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" },
  menu:    { d:"M3 12h18M3 6h18M3 18h18" },
  arrow:   { d:"M5 12h14M12 5l7 7-7 7" },
}

/* ── Palette ────────────────────────────────────────────────────────── */
const C = {
  g900:'#052e16', g800:'#14532d', g700:'#166534', g600:'#16a34a',
  g500:'#22c55e', g100:'#dcfce7', g50:'#f0fdf4',
  k900:'#111827', k700:'#374151', k500:'#6b7280', k400:'#9ca3af',
  k200:'#e5e7eb', k100:'#f3f4f6', k50:'#f9fafb', white:'#ffffff',
  r600:'#dc2626', r700:'#b91c1c', r50:'#fef2f2', r100:'#fee2e2',
  a700:'#b45309', a50:'#fffbeb',  a100:'#fef3c7',
}

const SIDEBAR_FULL = 240
const SIDEBAR_MINI = 68

const NAV = [
  { id:0, label:'Overview',      icon:'home'  },
  { id:1, label:'Scan Logs',     icon:'scan'  },
  { id:2, label:'Price Records', icon:'price' },
  { id:3, label:'Sync Logs',     icon:'sync'  },
  { id:4, label:'Error Logs',    icon:'alert' },
]

/* ── Micro helpers ──────────────────────────────────────────────────── */
function Badge({ label, v='green' }) {
  const s = {
    green: { bg:C.g50,  color:C.g700,  bd:C.g100  },
    red:   { bg:C.r50,  color:C.r700,  bd:C.r100  },
    amber: { bg:C.a50,  color:C.a700,  bd:C.a100  },
    gray:  { bg:C.k100, color:C.k700,  bd:C.k200  },
  }[v] || { bg:C.k100, color:C.k700, bd:C.k200 }
  return (
    <span style={{
      display:'inline-block', fontSize:11, fontWeight:700,
      padding:'3px 9px', borderRadius:99, whiteSpace:'nowrap',
      background:s.bg, color:s.color, border:`1px solid ${s.bd}`,
    }}>{label}</span>
  )
}

function ConfBadge({ v }) {
  if (!v) return <Badge label="No det." v="gray" />
  const pct = (v*100).toFixed(1)
  return <Badge label={`${pct}%`} v={v>=0.75?'green':v>=0.60?'amber':'red'} />
}

function StatusBadge({ val }) {
  const m = { success:'green', failed:'red', partial:'amber' }
  return <Badge label={val||'—'} v={m[val]||'gray'} />
}

const fmtDt = (ts) => ts
  ? new Date(ts).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
  : '—'

/* ── Stat Card ──────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, trend, icon, accent, loading }) {
  return (
    <div style={{
      background: accent ? `linear-gradient(135deg,${C.g900},${C.g800})` : C.white,
      borderRadius:14, padding:'20px',
      border: accent ? 'none' : `1px solid ${C.k100}`,
      boxShadow: accent ? '0 8px 24px rgba(5,46,22,.3)' : '0 1px 4px rgba(0,0,0,.06)',
      display:'flex', flexDirection:'column', gap:12,
      position:'relative', overflow:'hidden', minWidth:0,
    }}>
      {accent && <div style={{ position:'absolute',top:-28,right:-28,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,.05)' }} />}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <p style={{ fontSize:11,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',margin:0, color: accent?'rgba(255,255,255,.55)':C.k400 }}>{label}</p>
        <div style={{ width:32,height:32,borderRadius:9,flexShrink:0, background: accent?'rgba(255,255,255,.12)':C.g50, display:'flex',alignItems:'center',justifyContent:'center', color: accent?'rgba(255,255,255,.8)':C.g600 }}>
          <Svg d={IC[icon]?.d} d2={IC[icon]?.d2} size={15} />
        </div>
      </div>
      {loading
        ? <div style={{ height:38,width:90,borderRadius:8,background:accent?'rgba(255,255,255,.1)':C.k100, animation:'pulse 1.4s infinite' }} />
        : <div>
            <p style={{ fontSize:36,fontWeight:800,margin:0,lineHeight:1, color:accent?'#fff':C.k900, fontVariantNumeric:'tabular-nums' }}>{value??'—'}</p>
            {sub && <p style={{ fontSize:12,margin:'5px 0 0', color:accent?'rgba(255,255,255,.5)':C.k400 }}>{sub}</p>}
          </div>
      }
      {trend && !loading && (
        <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,alignSelf:'flex-start', background:accent?'rgba(255,255,255,.14)':C.g50, color:accent?'rgba(255,255,255,.85)':C.g700, padding:'3px 10px',borderRadius:99 }}>{trend}</span>
      )}
    </div>
  )
}

/* ── Data Table ─────────────────────────────────────────────────────── */
function DataTable({ columns, rows, loading }) {
  const TH = { padding:'10px 16px',fontSize:11,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:C.k400,textAlign:'left',background:C.k50,borderBottom:`1px solid ${C.k100}`,whiteSpace:'nowrap' }
  const TD = { padding:'12px 16px',fontSize:13,color:C.k700,verticalAlign:'middle' }

  if (loading) return (
    <div style={{ padding:'44px',textAlign:'center',color:C.k400,fontSize:13 }}>
      <div style={{ display:'inline-flex',gap:8,alignItems:'center' }}>
        <div style={{ width:16,height:16,border:`2px solid ${C.k200}`,borderTopColor:C.g600,borderRadius:'50%',animation:'spin .7s linear infinite' }} />
        Loading...
      </div>
    </div>
  )

  if (!rows.length) return (
    <div style={{ padding:'48px',textAlign:'center' }}>
      <div style={{ width:46,height:46,borderRadius:12,background:C.g50,margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',color:C.g600 }}>
        <Svg d={IC.scan.d} size={20} />
      </div>
      <p style={{ fontSize:14,color:C.k400,margin:0 }}>No records yet.</p>
    </div>
  )

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%',borderCollapse:'collapse',minWidth:480 }}>
        <thead><tr>{columns.map(c => <th key={c.key} style={TH}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              onMouseEnter={e => e.currentTarget.style.background=C.k50}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {columns.map(c => (
                <td key={c.key} style={{ ...TD, borderBottom: i<rows.length-1 ? `1px solid ${C.k100}` : 'none' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key]??'—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Toast ──────────────────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null
  const s = { ok:{bg:C.g50,bd:C.g100,c:C.g700}, warn:{bg:C.a50,bd:C.a100,c:C.a700}, err:{bg:C.r50,bd:C.r100,c:C.r600} }[toast.type] || {}
  return (
    <div style={{ position:'fixed',bottom:24,right:24,zIndex:998,display:'flex',alignItems:'center',gap:10, background:s.bg,border:`1px solid ${s.bd}`,borderRadius:12,padding:'13px 18px', boxShadow:'0 8px 24px rgba(0,0,0,.12)',animation:'slideUp .22s ease',maxWidth:380 }}>
      <p style={{ fontSize:13,fontWeight:500,color:s.c,margin:0 }}>{toast.text}</p>
    </div>
  )
}

/* ── Logout Modal ───────────────────────────────────────────────────── */
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,.45)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:24,animation:'fadeIn .15s ease' }}>
      <div style={{ background:C.white,borderRadius:20,padding:'32px 28px',width:'100%',maxWidth:360,textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.18)',animation:'scaleIn .18s ease' }}>
        <div style={{ width:58,height:58,borderRadius:'50%',background:C.r50,margin:'0 auto 18px',display:'flex',alignItems:'center',justifyContent:'center',color:C.r600 }}>
          <Svg d={IC.logout.d} size={26} />
        </div>
        <h2 style={{ fontSize:19,fontWeight:700,color:C.k900,margin:'0 0 8px' }}>Sign out?</h2>
        <p style={{ fontSize:14,color:C.k500,margin:'0 0 28px',lineHeight:1.6 }}>
          Are you sure you want to sign out of the Alescan admin panel?
        </p>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onCancel} style={{ flex:1,padding:'11px',borderRadius:10,border:`1px solid ${C.k200}`,background:C.white,fontSize:14,fontWeight:600,color:C.k700,cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background=C.k50}
            onMouseLeave={e=>e.currentTarget.style.background=C.white}>
            No, stay
          </button>
          <button onClick={onConfirm} style={{ flex:1,padding:'11px',borderRadius:10,border:'none',background:C.r600,fontSize:14,fontWeight:600,color:'#fff',cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background=C.r700}
            onMouseLeave={e=>e.currentTarget.style.background=C.r600}>
            Yes, sign out
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Recent Scans ───────────────────────────────────────────────────── */
function RecentScans({ onUnauth }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getScanLogs(5)
      .then(setRows)
      .catch(e => { if (e.message==='unauthorized') onUnauth() })
      .finally(() => setLoading(false))
  }, [])

  const wrap = { background:C.white,borderRadius:14,border:`1px solid ${C.k100}`,boxShadow:'0 1px 4px rgba(0,0,0,.05)',overflow:'hidden' }

  if (loading) return <div style={{ ...wrap,padding:'24px',textAlign:'center',color:C.k400,fontSize:13 }}>Loading...</div>
  if (!rows.length) return <div style={{ ...wrap,padding:'24px',textAlign:'center',color:C.k400,fontSize:13 }}>No scans recorded yet.</div>

  return (
    <div style={wrap}>
      {rows.map((r, i) => (
        <div key={i} style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 18px', borderBottom: i<rows.length-1 ? `1px solid ${C.k50}` : 'none' }}>
          <div style={{ width:38,height:38,borderRadius:10,flexShrink:0, background: r.products?C.g50:C.r50, display:'flex',alignItems:'center',justifyContent:'center', color: r.products?C.g600:C.r600 }}>
            <Svg d={IC.scan.d} size={15} />
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <p style={{ margin:0,fontSize:13,fontWeight:600,color:C.k900,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {r.products?.display_name || <em style={{ color:C.k400,fontWeight:400 }}>Unidentified</em>}
            </p>
            <p style={{ margin:0,fontSize:11,color:C.k400 }}>{fmtDt(r.scanned_at)}</p>
          </div>
          <ConfBadge v={r.confidence} />
          {r.price_shown && (
            <span style={{ fontSize:13,fontWeight:700,color:C.g700,flexShrink:0 }}>₱{Number(r.price_shown).toFixed(2)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── MAIN ────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate()
  const { authed, logout, user } = useAdminAuth()

  const [active,       setActive]       = useState(0)
  const [expanded,     setExpanded]     = useState(true)
  const [data,         setData]         = useState([])
  const [stats,        setStats]        = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [tabLoading,   setTabLoading]   = useState(false)
  const [syncing,      setSyncing]      = useState(false)
  const [toast,        setToast]        = useState(null)
  const [showLogout,   setShowLogout]   = useState(false)

  if (!authed) return <Navigate to="/admin/login" replace />

  const SW = expanded ? SIDEBAR_FULL : SIDEBAR_MINI

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      setStats(await getStats())
    } catch (e) {
      if (e.message === 'unauthorized') { logout(); navigate('/admin/login') }
    } finally {
      setStatsLoading(false)
    }
  }, [logout, navigate])

  useEffect(() => { loadStats() }, [loadStats])

  const loadTab = useCallback(async (t) => {
    if (t === 0) return
    setTabLoading(true); setData([])
    try {
      const fn = [null, getScanLogs, getPriceRecords, getSyncLogs, getErrorLogs][t]
      setData(await fn())
    } catch (e) {
      if (e.message === 'unauthorized') { logout(); navigate('/admin/login') }
    } finally {
      setTabLoading(false)
    }
  }, [logout, navigate])

  useEffect(() => { loadTab(active) }, [active, loadTab])

  async function handleSync() {
    setSyncing(true); setToast(null)
    try {
      const res = await triggerSync()
      const ok = res.result?.status === 'success'
      setToast({
        type: ok ? 'ok' : 'warn',
        text: ok
          ? `Sync complete — ${res.result.count} prices via ${res.result.extractor}`
          : `Sync issue: ${res.result?.error || 'unknown'}`,
      })
      loadStats()
      if (active === 3) loadTab(3)
    } catch {
      setToast({ type:'err', text:'Sync failed — is the backend running?' })
    } finally {
      setSyncing(false)
      setTimeout(() => setToast(null), 6000)
    }
  }

  const COLS = {
    1: [
      { key:'products',    label:'Commodity',    render: v => <span style={{ fontWeight:600,color:C.k900 }}>{v?.display_name||<em style={{ color:C.k400,fontWeight:400 }}>Unidentified</em>}</span> },
      { key:'confidence',  label:'Confidence',   render: v => <ConfBadge v={v} /> },
      { key:'price_shown', label:'Price shown',  render: v => v ? <span style={{ fontWeight:700,color:C.g700 }}>₱{Number(v).toFixed(2)}</span> : <span style={{ color:C.k200 }}>—</span> },
      { key:'scanned_at',  label:'Scanned at',   render: v => <span style={{ color:C.k400,fontSize:12 }}>{fmtDt(v)}</span> },
    ],
    2: [
      { key:'product',      label:'Commodity',    render: v => <span style={{ fontWeight:600,color:C.k900 }}>{v}</span> },
      { key:'official_srp', label:'Official SRP', render: v => <span style={{ fontWeight:800,color:C.g700,fontSize:15 }}>₱{Number(v).toFixed(2)}</span> },
      { key:'week_of',      label:'Week of',      render: v => <span style={{ color:C.k500 }}>{v}</span> },
      { key:'source',       label:'Source',       render: v => <span style={{ fontSize:12,color:C.k400 }}>{v}</span> },
    ],
    3: [
      { key:'status',         label:'Status',    render: v => <StatusBadge val={v} /> },
      { key:'extractor_used', label:'Extractor', render: v => <span style={{ fontFamily:'monospace',fontSize:12,background:C.k100,padding:'3px 8px',borderRadius:6 }}>{v}</span> },
      { key:'notes',          label:'Notes',     render: v => <span style={{ color:C.k500,display:'block',maxWidth:280,overflow:'hidden',textOverflow:'ellipsis' }}>{v||'—'}</span> },
      { key:'synced_at',      label:'Synced at', render: v => <span style={{ color:C.k400,fontSize:12 }}>{fmtDt(v)}</span> },
    ],
    4: [
      { key:'module',      label:'Module',  render: v => <span style={{ fontFamily:'monospace',fontSize:12,background:C.r50,color:C.r600,padding:'3px 8px',borderRadius:6 }}>{v}</span> },
      { key:'message',     label:'Message', render: v => <span style={{ color:C.k700,display:'block',maxWidth:360,overflow:'hidden',textOverflow:'ellipsis' }}>{v}</span> },
      { key:'occurred_at', label:'Date',    render: v => <span style={{ color:C.k400,fontSize:12 }}>{fmtDt(v)}</span> },
    ],
  }

  const title = NAV.find(n => n.id===active)?.label || 'Overview'
  const lastSyncDate = stats?.last_sync
    ? new Date(stats.last_sync.synced_at).toLocaleDateString('en-PH',{ month:'short', day:'numeric' })
    : 'Never'

  return (
    <div style={{ display:'flex',minHeight:'100vh',background:C.k50,
      fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:99px}
        button{font-family:inherit;cursor:pointer}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
        @keyframes slideUp{from{transform:translateY(14px);opacity:0}}
        @keyframes fadeIn{from{opacity:0}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.94)}}
        .nb:hover{background:${C.g50}!important;color:${C.g700}!important}
        .nb:hover .nic{background:${C.g100}!important;color:${C.g700}!important}
        .qb:hover{border-color:#86efac!important;box-shadow:0 4px 14px rgba(22,163,74,.12)!important}
        .rbtn:hover{background:${C.k100}!important}
        .sbtn:hover{opacity:.88}
        .logout-nav:hover{background:${C.r50}!important}
      `}</style>

      {/* ── SIDEBAR ───────────────────────────────────────────────── */}
      <aside style={{
        width:SW, flexShrink:0,
        background:C.white, borderRight:`1px solid ${C.k100}`,
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0,
        zIndex:200, transition:'width .2s ease', overflow:'hidden',
      }}>
        {/* Logo row */}
        <div style={{
          height:64, display:'flex', alignItems:'center',
          padding: expanded ? '0 14px' : '0',
          justifyContent: expanded ? 'space-between' : 'center',
          borderBottom:`1px solid ${C.k100}`, flexShrink:0,
        }}>
          {expanded && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <img
                src="/Alescan-Logo.png"
                alt="Alescan"
                style={{ width:36, height:36, objectFit:'contain', flexShrink:0 }}
              />
              <span style={{ fontSize:16, fontWeight:800, color:C.g800, letterSpacing:'.04em' }}>ALESCAN</span>
            </div>
          )}
          {!expanded && (
            <img src="/Alescan-Logo.png" alt="Alescan" style={{ width:32, height:32, objectFit:'contain' }} />
          )}
          <button onClick={() => setExpanded(o=>!o)} style={{
            width:28,height:28,borderRadius:7,border:'none',
            background:C.k100, color:C.k500, flexShrink:0,
            display:'flex',alignItems:'center',justifyContent:'center',
            marginLeft: expanded ? 0 : 0,
          }}>
            <Svg d={IC.menu.d} size={13} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1,padding:'12px 8px',overflowY:'auto',overflowX:'hidden' }}>
          {expanded && (
            <p style={{ fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#d1d5db',padding:'0 8px',marginBottom:6 }}>MENU</p>
          )}
          {NAV.map(item => {
            const on = active===item.id
            return (
              <button key={item.id} className="nb" onClick={() => setActive(item.id)}
                title={!expanded ? item.label : undefined}
                style={{
                  width:'100%', display:'flex', alignItems:'center',
                  gap: expanded?10:0, justifyContent: expanded?'flex-start':'center',
                  padding: expanded?'9px 8px':'9px', borderRadius:10,
                  border:'none', marginBottom:2,
                  background: on?C.g50:'transparent',
                  color: on?C.g700:C.k500,
                  fontWeight: on?600:400, fontSize:13,
                  transition:'all .15s', textAlign:'left',
                  whiteSpace:'nowrap', overflow:'hidden',
                }}>
                <div className="nic" style={{
                  width:30,height:30,borderRadius:8,flexShrink:0,
                  background: on?C.g600:'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color: on?'#fff':C.k400, transition:'all .15s',
                }}>
                  <Svg d={IC[item.icon]?.d} d2={IC[item.icon]?.d2} size={14} />
                </div>
                {expanded && item.label}
                {expanded && on && <div style={{ marginLeft:'auto',width:6,height:6,borderRadius:'50%',background:C.g500,flexShrink:0 }} />}
              </button>
            )
          })}

          <div style={{ borderTop:`1px solid ${C.k100}`,marginTop:10,paddingTop:10 }}>
            {expanded && (
              <p style={{ fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'#d1d5db',padding:'0 8px',marginBottom:6 }}>GENERAL</p>
            )}
            <button onClick={() => setShowLogout(true)}
              className="logout-nav"
              title={!expanded ? 'Sign out' : undefined}
              style={{
                width:'100%', display:'flex', alignItems:'center',
                gap: expanded?10:0, justifyContent: expanded?'flex-start':'center',
                padding: expanded?'9px 8px':'9px', borderRadius:10,
                border:'none', background:'transparent',
                color:'#ef4444', fontSize:13, fontWeight:500,
                transition:'all .15s',
              }}>
              <div style={{ width:30,height:30,borderRadius:8,flexShrink:0,background:C.r50,display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444' }}>
                <Svg d={IC.logout.d} size={14} />
              </div>
              {expanded && 'Sign Out'}
            </button>
          </div>
        </nav>

        {/* Admin label at bottom */}
        {expanded && (
          <div style={{
            margin:'0 8px 10px',
            padding:'14px 16px',
            background:C.g900,
            borderRadius:12,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:34,height:34,borderRadius:8,
              background:'rgba(255,255,255,.12)', flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <span style={{ color:'#fff',fontSize:14,fontWeight:800,letterSpacing:'.02em' }}>
                {(user||'A')[0].toUpperCase()}
              </span>
            </div>
            <span style={{ fontSize:14,fontWeight:800,color:'#fff',letterSpacing:'.06em',textTransform:'uppercase' }}>
              {user || 'ADMIN'}
            </span>
          </div>
        )}
        {!expanded && (
          <div style={{ margin:'0 auto 14px',width:40,height:40,borderRadius:10,background:C.g900,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <span style={{ color:'#fff',fontSize:14,fontWeight:800 }}>{(user||'A')[0].toUpperCase()}</span>
          </div>
        )}
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────── */}
      <div style={{ marginLeft:SW,flex:1,minWidth:0,display:'flex',flexDirection:'column',transition:'margin-left .2s ease' }}>

        {/* Topbar */}
        <header style={{
          height:64, background:C.white, borderBottom:`1px solid ${C.k100}`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 24px', gap:12, position:'sticky', top:0, zIndex:100,
        }}>
          <div style={{ minWidth:0 }}>
            <h1 style={{ fontSize:17,fontWeight:700,color:C.k900,margin:0,whiteSpace:'nowrap' }}>{title}</h1>
            <p style={{ fontSize:11,color:C.k400,margin:0 }}>
              {active===0 ? 'Live System Overview' : `Showing latest ${title.toLowerCase()}`}
            </p>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
            {active!==0 && (
              <button className="rbtn" onClick={() => loadTab(active)} disabled={tabLoading} style={{
                display:'flex',alignItems:'center',gap:6,padding:'8px 14px',
                borderRadius:8,border:`1px solid ${C.k200}`,background:C.white,
                color:C.k500,fontSize:13,fontWeight:500,transition:'all .15s',
              }}>
                <Svg d={IC.refresh.d} size={13} />
                Refresh
              </button>
            )}
            <button className="sbtn" onClick={handleSync} disabled={syncing} style={{
              display:'flex',alignItems:'center',gap:7,padding:'8px 16px',
              borderRadius:8,border:'none',background:C.g800,color:'#fff',
              fontSize:13,fontWeight:700,transition:'all .15s',whiteSpace:'nowrap',
              letterSpacing:'.02em',
            }}>
              <div style={{ animation:syncing?'spin .8s linear infinite':'none',display:'flex' }}>
                <Svg d={IC.sync.d} size={14} />
              </div>
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1,padding:'22px',overflowY:'auto',display:'flex',flexDirection:'column',gap:20 }}>

          {/* OVERVIEW */}
          {active===0 && (<>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(178px,1fr))',gap:14 }}>
              <StatCard label="Total Scans"    icon="scan"   accent
                value={stats?.total_scans ?? '…'}
                sub="All time consumer scans"
                trend={stats?.total_scans != null ? `${stats.total_scans} Logged` : null}
                loading={statsLoading} />
              <StatCard label="Active Prices"  icon="price"
                value={stats?.active_prices ?? '…'}
                sub={`of ${stats?.total_products ?? 3} commodities`}
                loading={statsLoading} />
              <StatCard label="Last Sync"      icon="sync"
                value={statsLoading ? '…' : lastSyncDate}
                sub={stats?.last_sync?.extractor_used || 'Not yet synced'}
                trend={
                  stats?.last_sync?.status === 'success' ? '✓ Success' :
                  stats?.last_sync?.status === 'failed'  ? '✗ Failed'  : null
                }
                loading={statsLoading} />
              <StatCard label="Error Logs"     icon="alert"
                value={stats?.total_errors ?? '…'}
                sub="Across all modules"
                loading={statsLoading} />
            </div>

            <div>
              <p style={{ fontSize:14,fontWeight:700,color:C.k900,marginBottom:12 }}>Quick Access</p>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:10 }}>
                {NAV.slice(1).map(item => (
                  <button key={item.id} className="qb" onClick={() => setActive(item.id)} style={{
                    display:'flex',alignItems:'center',gap:12,padding:'13px 15px',
                    borderRadius:12,border:`1px solid ${C.k100}`,background:C.white,
                    textAlign:'left',transition:'all .15s',cursor:'pointer',
                    boxShadow:'0 1px 3px rgba(0,0,0,.05)',
                  }}>
                    <div style={{ width:36,height:36,borderRadius:9,background:C.g50,display:'flex',alignItems:'center',justifyContent:'center',color:C.g600,flexShrink:0 }}>
                      <Svg d={IC[item.icon]?.d} d2={IC[item.icon]?.d2} size={16} />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ margin:0,fontSize:13,fontWeight:600,color:C.k900,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.label}</p>
                      <p style={{ margin:0,fontSize:11,color:C.k400 }}>View →</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
                <p style={{ fontSize:14,fontWeight:700,color:C.k900,margin:0 }}>Recent Scans</p>
                <button onClick={() => setActive(1)} style={{ fontSize:12,color:C.g600,fontWeight:600,border:'none',background:'none',display:'flex',alignItems:'center',gap:4,cursor:'pointer' }}>
                  View all <Svg d={IC.arrow.d} size={11} />
                </button>
              </div>
              <RecentScans onUnauth={() => { logout(); navigate('/admin/login') }} />
            </div>
          </>)}

          {/* DATA TABS */}
          {active!==0 && (
            <div style={{ background:C.white,borderRadius:16,border:`1px solid ${C.k100}`,boxShadow:'0 1px 4px rgba(0,0,0,.05)',overflow:'hidden' }}>
              <div style={{ padding:'15px 20px',borderBottom:`1px solid ${C.k100}`,display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:34,height:34,borderRadius:9,background:C.g50,display:'flex',alignItems:'center',justifyContent:'center',color:C.g600 }}>
                  <Svg d={IC[NAV[active]?.icon]?.d} d2={IC[NAV[active]?.icon]?.d2} size={16} />
                </div>
                <div>
                  <p style={{ margin:0,fontSize:14,fontWeight:700,color:C.k900 }}>{title}</p>
                  <p style={{ margin:0,fontSize:12,color:C.k400 }}>
                    {tabLoading ? 'Loading...' : `${data.length} record${data.length!==1?'s':''}`}
                  </p>
                </div>
              </div>
              <DataTable columns={COLS[active]||[]} rows={data} loading={tabLoading} />
            </div>
          )}
        </main>
      </div>

      <Toast toast={toast} />
      {showLogout && <LogoutModal onConfirm={() => { logout(); navigate('/admin/login') }} onCancel={() => setShowLogout(false)} />}
    </div>
  )
}