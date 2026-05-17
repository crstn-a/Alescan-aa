// frontend/src/pages/AdminDashboard.jsx
// ⚠️  Place Alescan-Logo.png in your /public folder

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'
import {
  getStats, getScanLogs, getSyncLogs,
  getErrorLogs, getPriceRecords, triggerSync,
  getAnalyticsPrices, getAnalyticsScans, getAnalyticsEvaluations,
  getViolations, createViolation, updateViolation, updateViolationStatus,
  getDailyVolume
} from '../api/adminApi'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'

/* ── Icons ──────────────────────────────────────────────────────────── */
const Svg = ({ d, d2, d3, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}{d3 && <path d={d3} />}
  </svg>
)
const IC = {
  home: { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", d2: "M9 22V12h6v10" },
  scan: { d: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M8 12h8M12 8v8" },
  price: { d: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  sync: { d: "M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" },
  alert: { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" },
  logout: { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" },
  refresh: { d: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" },
  menu: { d: "M3 12h18M3 6h18M3 18h18" },
  arrow: { d: "M5 12h14M12 5l7 7-7 7" },
  analytics: { d: "M3 3v18h18", d2: "M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" },
  eval: { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  violation: { d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }
}

/* ── Palette ────────────────────────────────────────────────────────── */
const C = {
  g900: '#052e16', g800: '#14532d', g700: '#166534', g600: '#16a34a',
  g500: '#22c55e', g100: '#dcfce7', g50: '#f0fdf4',
  k900: '#111827', k700: '#374151', k500: '#6b7280', k400: '#9ca3af',
  k200: '#e5e7eb', k100: '#f3f4f6', k50: '#f9fafb', white: '#ffffff',
  r600: '#dc2626', r700: '#b91c1c', r50: '#fef2f2', r100: '#fee2e2',
  a700: '#b45309', a50: '#fffbeb', a100: '#fef3c7',
}

const SIDEBAR_FULL = 240
const SIDEBAR_MINI = 68

const NAV = [
  { id: 0, label: 'Overview', icon: 'home' },
  { id: 5, label: 'Analytics', icon: 'analytics' },
  { id: 6, label: 'AI Evaluation', icon: 'eval' },
  { id: 7, label: 'Violations', icon: 'violation' },
  { id: 1, label: 'Scan Logs', icon: 'scan' },
  { id: 2, label: 'Price Records', icon: 'price' },
  { id: 3, label: 'Sync Logs', icon: 'sync' },
  { id: 4, label: 'Error Logs', icon: 'alert' },
]

/* ── Micro helpers ──────────────────────────────────────────────────── */
function Badge({ label, v = 'green' }) {
  const s = {
    green: { bg: C.g50, color: C.g700, bd: C.g100 },
    red: { bg: C.r50, color: C.r700, bd: C.r100 },
    amber: { bg: C.a50, color: C.a700, bd: C.a100 },
    gray: { bg: C.k100, color: C.k700, bd: C.k200 },
  }[v] || { bg: C.k100, color: C.k700, bd: C.k200 }
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap',
      background: s.bg, color: s.color, border: `1px solid ${s.bd}`,
    }}>{label}</span>
  )
}

function ConfBadge({ v }) {
  if (!v) return <Badge label="No det." v="gray" />
  const pct = (v * 100).toFixed(1)
  return <Badge label={`${pct}%`} v={v >= 0.75 ? 'green' : v >= 0.60 ? 'amber' : 'red'} />
}

function StatusBadge({ val }) {
  const m = { success: 'green', failed: 'red', partial: 'amber' }
  return <Badge label={val || '—'} v={m[val] || 'gray'} />
}

const fmtDt = (ts) => ts
  ? new Date(ts).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

/* ── Stat Card ──────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, trend, icon, accent, loading }) {
  return (
    <div style={{
      background: accent ? `linear-gradient(135deg,${C.g900},${C.g800})` : C.white,
      borderRadius: 14, padding: '20px',
      border: accent ? 'none' : `1px solid ${C.k100}`,
      boxShadow: accent ? '0 8px 24px rgba(5,46,22,.3)' : '0 1px 4px rgba(0,0,0,.06)',
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative', overflow: 'hidden', minWidth: 0,
    }}>
      {accent && <div style={{ position: 'absolute', top: -28, right: -28, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', margin: 0, color: accent ? 'rgba(255,255,255,.55)' : C.k400 }}>{label}</p>
        <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: accent ? 'rgba(255,255,255,.12)' : C.g50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent ? 'rgba(255,255,255,.8)' : C.g600 }}>
          <Svg d={IC[icon]?.d} d2={IC[icon]?.d2} size={15} />
        </div>
      </div>
      {loading
        ? <div style={{ height: 38, width: 90, borderRadius: 8, background: accent ? 'rgba(255,255,255,.1)' : C.k100, animation: 'pulse 1.4s infinite' }} />
        : <div>
          <p style={{ fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1, color: accent ? '#fff' : C.k900, fontVariantNumeric: 'tabular-nums' }}>{value ?? '—'}</p>
          {sub && <p style={{ fontSize: 12, margin: '5px 0 0', color: accent ? 'rgba(255,255,255,.5)' : C.k400 }}>{sub}</p>}
        </div>
      }
      {trend && !loading && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, alignSelf: 'flex-start', background: accent ? 'rgba(255,255,255,.14)' : C.g50, color: accent ? 'rgba(255,255,255,.85)' : C.g700, padding: '3px 10px', borderRadius: 99 }}>{trend}</span>
      )}
    </div>
  )
}

/* ── Data Table ─────────────────────────────────────────────────────── */
function DataTable({ columns, rows, loading }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)

  const TH = { padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.k400, textAlign: 'left', background: C.k50, borderBottom: `1px solid ${C.k100}`, whiteSpace: 'nowrap' }
  const TD = { padding: '12px 16px', fontSize: 13, color: C.k700, verticalAlign: 'middle' }

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * perPage
  const pagedRows = rows.slice(startIdx, startIdx + perPage)
  const showPagination = rows.length > 0

  // Reset to page 1 when rows change substantially
  useEffect(() => { setPage(1) }, [rows.length])

  const PgBtn = ({ children, onClick, disabled, active }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 32, height: 32, padding: '0 8px', borderRadius: 8,
        border: active ? `1.5px solid ${C.g500}` : `1px solid ${C.k200}`,
        background: active ? C.g50 : disabled ? C.k50 : C.white,
        color: active ? C.g700 : disabled ? C.k200 : C.k700,
        fontSize: 13, fontWeight: active ? 700 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .15s', flexShrink: 0,
      }}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = C.k100 }}
      onMouseLeave={e => { if (!disabled && !active) e.currentTarget.style.background = C.white }}
    >{children}</button>
  )

  if (loading) return (
    <div style={{ padding: '44px', textAlign: 'center', color: C.k400, fontSize: 13 }}>
      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <div style={{ width: 16, height: 16, border: `2px solid ${C.k200}`, borderTopColor: C.g600, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        Loading...
      </div>
    </div>
  )

  if (!rows.length) return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: C.g50, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.g600 }}>
        <Svg d={IC.scan.d} size={20} />
      </div>
      <p style={{ fontSize: 14, color: C.k400, margin: 0 }}>No records yet.</p>
    </div>
  )

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead><tr>{columns.map(c => <th key={c.key} style={TH}>{c.label}</th>)}</tr></thead>
          <tbody>
            {pagedRows.map((row, i) => (
              <tr key={i}
                onMouseEnter={e => e.currentTarget.style.background = C.k50}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {columns.map(c => (
                  <td key={c.key} style={{ ...TD, borderBottom: i < pagedRows.length - 1 ? `1px solid ${C.k100}` : 'none' }}>
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {showPagination && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
          padding: '12px 16px', borderTop: `1px solid ${C.k100}`, background: C.k50,
        }}>
          {/* Left: per-page selector + record info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: C.k500, fontWeight: 500 }}>Rows per page:</span>
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                style={{
                  padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.k200}`,
                  fontSize: 13, fontWeight: 600, color: C.k700, background: C.white,
                  cursor: 'pointer', outline: 'none',
                }}
              >
                {[10, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: 12, color: C.k400, fontWeight: 500 }}>
              Showing {startIdx + 1}–{Math.min(startIdx + perPage, rows.length)} of {rows.length} records
            </span>
          </div>

          {/* Right: page navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PgBtn onClick={() => setPage(1)} disabled={safePage <= 1}>«</PgBtn>
            <PgBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>‹</PgBtn>
            {/* Page number buttons (show up to 5) */}
            {(() => {
              const pages = []
              let start = Math.max(1, safePage - 2)
              let end = Math.min(totalPages, start + 4)
              if (end - start < 4) start = Math.max(1, end - 4)
              for (let i = start; i <= end; i++) pages.push(i)
              return pages.map(p => (
                <PgBtn key={p} onClick={() => setPage(p)} active={p === safePage}>{p}</PgBtn>
              ))
            })()}
            <PgBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>›</PgBtn>
            <PgBtn onClick={() => setPage(totalPages)} disabled={safePage >= totalPages}>»</PgBtn>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Toast ──────────────────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null
  const s = { ok: { bg: C.g50, bd: C.g100, c: C.g700 }, warn: { bg: C.a50, bd: C.a100, c: C.a700 }, err: { bg: C.r50, bd: C.r100, c: C.r600 } }[toast.type] || {}
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 998, display: 'flex', alignItems: 'center', gap: 10, background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 12, padding: '13px 18px', boxShadow: '0 8px 24px rgba(0,0,0,.12)', animation: 'slideUp .22s ease', maxWidth: 380 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: s.c, margin: 0 }}>{toast.text}</p>
    </div>
  )
}

/* ── Logout Modal ───────────────────────────────────────────────────── */
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn .15s ease' }}>
      <div style={{ background: C.white, borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.18)', animation: 'scaleIn .18s ease' }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: C.r50, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.r600 }}>
          <Svg d={IC.logout.d} size={26} />
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: C.k900, margin: '0 0 8px' }}>Sign out?</h2>
        <p style={{ fontSize: 14, color: C.k500, margin: '0 0 28px', lineHeight: 1.6 }}>
          Are you sure you want to sign out of the Alescan admin panel?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${C.k200}`, background: C.white, fontSize: 14, fontWeight: 600, color: C.k700, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.k50}
            onMouseLeave={e => e.currentTarget.style.background = C.white}>
            No, stay
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: C.r600, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.r700}
            onMouseLeave={e => e.currentTarget.style.background = C.r600}>
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
      .catch(e => { if (e.message === 'unauthorized') onUnauth() })
      .finally(() => setLoading(false))
  }, [])

  const wrap = { background: C.white, borderRadius: 14, border: `1px solid ${C.k100}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }

  if (loading) return <div style={{ ...wrap, padding: '24px', textAlign: 'center', color: C.k400, fontSize: 13 }}>Loading...</div>
  if (!rows.length) return <div style={{ ...wrap, padding: '24px', textAlign: 'center', color: C.k400, fontSize: 13 }}>No scans recorded yet.</div>

  return (
    <div style={wrap}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < rows.length - 1 ? `1px solid ${C.k50}` : 'none' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: r.products ? C.g50 : C.r50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.products ? C.g600 : C.r600 }}>
            <Svg d={IC.scan.d} size={15} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.k900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.products?.display_name || <em style={{ color: C.k400, fontWeight: 400 }}>Unidentified</em>}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.k400 }}>{fmtDt(r.scanned_at)}</p>
          </div>
          <ConfBadge v={r.confidence} />
          {r.price_shown && (
            <span style={{ fontSize: 13, fontWeight: 700, color: C.g700, flexShrink: 0 }}>₱{Number(r.price_shown).toFixed(2)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Violations Form ────────────────────────────────────────────────── */
function ViolationsForm({ onSubmit, onUnauth }) {
  const [formData, setFormData] = useState({
    name: '',
    store_number: '',
    complaint_description: '',
    image: null
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.store_number || !formData.complaint_description) {
      return
    }

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('store_number', formData.store_number)
      formDataToSend.append('complaint_description', formData.complaint_description)
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      await createViolation(formDataToSend)
      setFormData({ name: '', store_number: '', complaint_description: '', image: null })
      onSubmit()
    } catch (e) {
      if (e.message === 'unauthorized') onUnauth()
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setFormData(prev => ({ ...prev, image: file }))
  }

  return (
    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.k100}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '24px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.k900, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.g50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.g600 }}>
          <Svg d={IC.violation.d} size={16} />
        </div>
        Submit Consumer Complaint
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.k700, marginBottom: '6px' }}>
              Consumer Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.k200}`,
                fontSize: 14, color: C.k900, background: C.white,
                outline: 'none', transition: 'border-color .15s'
              }}
              onFocus={(e) => e.target.style.borderColor = C.g500}
              onBlur={(e) => e.target.style.borderColor = C.k200}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.k700, marginBottom: '6px' }}>
              Store Number *
            </label>
            <input
              type="text"
              value={formData.store_number}
              onChange={(e) => setFormData(prev => ({ ...prev, store_number: e.target.value }))}
              required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.k200}`,
                fontSize: 14, color: C.k900, background: C.white,
                outline: 'none', transition: 'border-color .15s'
              }}
              onFocus={(e) => e.target.style.borderColor = C.g500}
              onBlur={(e) => e.target.style.borderColor = C.k200}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.k700, marginBottom: '6px' }}>
            Complaint Description *
          </label>
          <textarea
            value={formData.complaint_description}
            onChange={(e) => setFormData(prev => ({ ...prev, complaint_description: e.target.value }))}
            required
            rows={4}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.k200}`,
              fontSize: 14, color: C.k900, background: C.white, resize: 'vertical',
              outline: 'none', transition: 'border-color .15s', fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = C.g500}
            onBlur={(e) => e.target.style.borderColor = C.k200}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.k700, marginBottom: '6px' }}>
            Supporting Image (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.k200}`,
              fontSize: 14, color: C.k900, background: C.white,
              outline: 'none', transition: 'border-color .15s'
            }}
            onFocus={(e) => e.target.style.borderColor = C.g500}
            onBlur={(e) => e.target.style.borderColor = C.k200}
          />
          {formData.image && (
            <p style={{ fontSize: 12, color: C.k500, margin: '4px 0 0' }}>
              Selected: {formData.image.name}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !formData.name || !formData.store_number || !formData.complaint_description}
          style={{
            padding: '12px 24px', borderRadius: 8, border: 'none',
            background: submitting ? C.k200 : C.g600, color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'all .15s', alignSelf: 'flex-start'
          }}
          onMouseEnter={(e) => !submitting && (e.target.style.background = C.g700)}
          onMouseLeave={(e) => !submitting && (e.target.style.background = C.g600)}
        >
          {submitting ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  )
}

/* ── Edit Violation Modal ───────────────────────────────────────────── */
function EditViolationModal({ violation, onSave, onCancel, onUnauth }) {
  const [formData, setFormData] = useState({
    name: violation?.name || '',
    store_number: violation?.store_number || '',
    complaint_description: violation?.complaint_description || '',
    status: violation?.status || 'submitted',
    image: null
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.store_number || !formData.complaint_description) {
      return
    }

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('store_number', formData.store_number)
      formDataToSend.append('complaint_description', formData.complaint_description)
      formDataToSend.append('status', formData.status)
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      await updateViolation(violation.id, formDataToSend)
      onSave()
    } catch (e) {
      if (e.message === 'unauthorized') onUnauth()
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    setFormData(prev => ({ ...prev, image: file }))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn .15s ease' }}>
      <div style={{ background: C.white, borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.18)', animation: 'scaleIn .18s ease' }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: C.k900, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.g50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.g600 }}>
            <Svg d={IC.violation.d} size={16} />
          </div>
          Edit Violation
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.k700, marginBottom: '6px' }}>
                Consumer Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.k200}`,
                  fontSize: 14, color: C.k900, background: C.white,
                  outline: 'none', transition: 'border-color .15s'
                }}
                onFocus={(e) => e.target.style.borderColor = C.g500}
                onBlur={(e) => e.target.style.borderColor = C.k200}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.k700, marginBottom: '6px' }}>
                Store Number *
              </label>
              <input
                type="text"
                value={formData.store_number}
                onChange={(e) => setFormData(prev => ({ ...prev, store_number: e.target.value }))}
                required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.k200}`,
                  fontSize: 14, color: C.k900, background: C.white,
                  outline: 'none', transition: 'border-color .15s'
                }}
                onFocus={(e) => e.target.style.borderColor = C.g500}
                onBlur={(e) => e.target.style.borderColor = C.k200}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.k700, marginBottom: '6px' }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.k200}`,
                fontSize: 14, color: C.k900, background: C.white,
                outline: 'none', transition: 'border-color .15s'
              }}
              onFocus={(e) => e.target.style.borderColor = C.g500}
              onBlur={(e) => e.target.style.borderColor = C.k200}
            >
              <option value="submitted">Submitted</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.k700, marginBottom: '6px' }}>
              Complaint Description *
            </label>
            <textarea
              value={formData.complaint_description}
              onChange={(e) => setFormData(prev => ({ ...prev, complaint_description: e.target.value }))}
              required
              rows={4}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.k200}`,
                fontSize: 14, color: C.k900, background: C.white, resize: 'vertical',
                outline: 'none', transition: 'border-color .15s', fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = C.g500}
              onBlur={(e) => e.target.style.borderColor = C.k200}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.k700, marginBottom: '6px' }}>
              Update Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.k200}`,
                fontSize: 14, color: C.k900, background: C.white,
                outline: 'none', transition: 'border-color .15s'
              }}
              onFocus={(e) => e.target.style.borderColor = C.g500}
              onBlur={(e) => e.target.style.borderColor = C.k200}
            />
            {violation?.image_url && !formData.image && (
              <p style={{ fontSize: 12, color: C.k500, margin: '4px 0 0' }}>
                Current: <a href={violation.image_url} target="_blank" rel="noopener noreferrer" style={{ color: C.g600 }}>View existing image</a>
              </p>
            )}
            {formData.image && (
              <p style={{ fontSize: 12, color: C.k500, margin: '4px 0 0' }}>
                New image selected: {formData.image.name}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${C.k200}`,
                background: C.white, fontSize: 14, fontWeight: 600, color: C.k700, cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.k50}
              onMouseLeave={e => e.currentTarget.style.background = C.white}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.name || !formData.store_number || !formData.complaint_description}
              style={{
                flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                background: submitting ? C.k200 : C.g600, color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={e => !submitting && (e.currentTarget.style.background = C.g700)}
              onMouseLeave={e => !submitting && (e.currentTarget.style.background = C.g600)}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── MAIN ────────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate()
  const { authed, logout, user } = useAdminAuth()

  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(true)
  const [data, setData] = useState([])
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState(null)
  const [showLogout, setShowLogout] = useState(false)
  const [editingViolation, setEditingViolation] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [volumeWeekOffset, setVolumeWeekOffset] = useState(0)
  const [volumeData, setVolumeData] = useState(null)
  const [volumeLoading, setVolumeLoading] = useState(false)

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
      if (t === 5) {
        const [prices, scans] = await Promise.all([getAnalyticsPrices(), getAnalyticsScans()]);
        setData({ prices, scans });
      } else if (t === 6) {
        setData(await getAnalyticsEvaluations());
      } else if (t === 7) {
        setData(await getViolations());
      } else {
        const fn = [null, getScanLogs, getPriceRecords, getSyncLogs, getErrorLogs][t]
        if (fn) setData(await fn())
      }
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
      setToast({ type: 'err', text: 'Sync failed — is the backend running?' })
    } finally {
      setSyncing(false)
      setTimeout(() => setToast(null), 6000)
    }
  }

  // Handle status change for violations
  const handleStatusChange = async (violationId, newStatus) => {
    try {
      await updateViolationStatus(violationId, newStatus)
      setToast({ type: 'ok', text: `Status updated to ${newStatus}` })
      loadTab(7) // Reload violations data
    } catch (e) {
      if (e.message === 'unauthorized') { logout(); navigate('/admin/login') }
      setToast({ type: 'err', text: 'Failed to update status' })
    } finally {
      setTimeout(() => setToast(null), 3000)
    }
  }

  // Handle edit violation
  const handleEditViolation = (violation) => {
    setEditingViolation(violation)
    setShowEditModal(true)
  }

  const COLS = {
    1: [
      { key: 'products', label: 'Commodity', render: v => <span style={{ fontWeight: 600, color: C.k900 }}>{v?.display_name || <em style={{ color: C.k400, fontWeight: 400 }}>Unidentified</em>}</span> },
      { key: 'confidence', label: 'Confidence', render: v => <ConfBadge v={v} /> },
      { key: 'price_shown', label: 'Price shown', render: v => v ? <span style={{ fontWeight: 700, color: C.g700 }}>₱{Number(v).toFixed(2)}</span> : <span style={{ color: C.k200 }}>—</span> },
      { key: 'scanned_at', label: 'Scanned at', render: v => <span style={{ color: C.k400, fontSize: 12 }}>{fmtDt(v)}</span> },
    ],
    2: [
      { key: 'product', label: 'Commodity', render: v => <span style={{ fontWeight: 600, color: C.k900 }}>{v}</span> },
      { key: 'official_srp', label: 'Official SRP', render: v => <span style={{ fontWeight: 800, color: C.g700, fontSize: 15 }}>₱{Number(v).toFixed(2)}</span> },
      { key: 'week_of', label: 'Week of', render: v => <span style={{ color: C.k500 }}>{v}</span> },
      { key: 'source', label: 'Source', render: v => <span style={{ fontSize: 12, color: C.k400 }}>{v}</span> },
    ],
    3: [
      { key: 'status', label: 'Status', render: v => <StatusBadge val={v} /> },
      { key: 'extractor_used', label: 'Extractor', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, background: C.k100, padding: '3px 8px', borderRadius: 6 }}>{v}</span> },
      { key: 'notes', label: 'Notes', render: v => <span style={{ color: C.k500, display: 'block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v || '—'}</span> },
      { key: 'synced_at', label: 'Synced at', render: v => <span style={{ color: C.k400, fontSize: 12 }}>{fmtDt(v)}</span> },
    ],
    4: [
      { key: 'module', label: 'Module', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, background: C.r50, color: C.r600, padding: '3px 8px', borderRadius: 6 }}>{v}</span> },
      { key: 'message', label: 'Message', render: v => <span style={{ color: C.k700, display: 'block', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span> },
      { key: 'occurred_at', label: 'Date', render: v => <span style={{ color: C.k400, fontSize: 12 }}>{fmtDt(v)}</span> },
    ],
    7: [
      { key: 'name', label: 'Consumer Name', render: v => <span style={{ fontWeight: 600, color: C.k900 }}>{v}</span> },
      { key: 'store_number', label: 'Store Number', render: v => <span style={{ fontWeight: 600, color: C.g700 }}>{v}</span> },
      { key: 'complaint_description', label: 'Complaint', render: v => <span style={{ color: C.k700, display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span> },
      { key: 'image_url', label: 'Image', render: v => v ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: C.g600, textDecoration: 'none', fontSize: 12 }}>View Image</a> : <span style={{ color: C.k400 }}>—</span> },
      {
        key: 'status', label: 'Status', render: (v, row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge val={v || 'submitted'} />
            {v !== 'archived' && (
              <select
                value={v || 'submitted'}
                onChange={(e) => handleStatusChange(row.id, e.target.value)}
                style={{
                  padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.k200}`,
                  fontSize: 11, background: C.white, color: C.k700
                }}
              >
                <option value="submitted">Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="archived">Archive</option>
              </select>
            )}
          </div>
        )
      },
      { key: 'created_at', label: 'Submitted', render: v => <span style={{ color: C.k400, fontSize: 12 }}>{fmtDt(v)}</span> },
      {
        key: 'actions', label: 'Actions', render: (v, row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleEditViolation(row)}
              style={{
                padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.k200}`,
                background: C.white, color: C.k600, fontSize: 11, fontWeight: 500,
                cursor: 'pointer', transition: 'all .15s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = C.g50
                e.target.style.color = C.g700
              }}
              onMouseLeave={(e) => {
                e.target.style.background = C.white
                e.target.style.color = C.k600
              }}
            >
              Edit
            </button>
          </div>
        )
      },
    ],
  }

  const title = NAV.find(n => n.id === active)?.label || 'Overview'
  const lastSyncDate = stats?.last_sync
    ? new Date(stats.last_sync.synced_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
    : 'Never'

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: C.k50,
      fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif"
    }}>

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
        width: SW, flexShrink: 0,
        background: C.white, borderRight: `1px solid ${C.k100}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 200, transition: 'width .2s ease', overflow: 'hidden',
      }}>
        {/* Logo row */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          padding: expanded ? '0 14px' : '0',
          justifyContent: expanded ? 'space-between' : 'center',
          borderBottom: `1px solid ${C.k100}`, flexShrink: 0,
        }}>
          {expanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/Alescan-Logo.png"
                alt="Alescan"
                style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
              />
              <span style={{ fontSize: 16, fontWeight: 800, color: C.g800, letterSpacing: '.04em' }}>ALESCAN</span>
            </div>
          )}
          {!expanded && (
            <img src="/Alescan-Logo.png" alt="Alescan" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          )}
          <button onClick={() => setExpanded(o => !o)} style={{
            width: 28, height: 28, borderRadius: 7, border: 'none',
            background: C.k100, color: C.k500, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: expanded ? 0 : 0,
          }}>
            <Svg d={IC.menu.d} size={13} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {expanded && (
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#d1d5db', padding: '0 8px', marginBottom: 6 }}>MENU</p>
          )}
          {NAV.map(item => {
            const on = active === item.id
            return (
              <button key={item.id} className="nb" onClick={() => setActive(item.id)}
                title={!expanded ? item.label : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: expanded ? 10 : 0, justifyContent: expanded ? 'flex-start' : 'center',
                  padding: expanded ? '9px 8px' : '9px', borderRadius: 10,
                  border: 'none', marginBottom: 2,
                  background: on ? C.g50 : 'transparent',
                  color: on ? C.g700 : C.k500,
                  fontWeight: on ? 600 : 400, fontSize: 13,
                  transition: 'all .15s', textAlign: 'left',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}>
                <div className="nic" style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: on ? C.g600 : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: on ? '#fff' : C.k400, transition: 'all .15s',
                }}>
                  <Svg d={IC[item.icon]?.d} d2={IC[item.icon]?.d2} size={14} />
                </div>
                {expanded && item.label}
                {expanded && on && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: C.g500, flexShrink: 0 }} />}
              </button>
            )
          })}

          <div style={{ borderTop: `1px solid ${C.k100}`, marginTop: 10, paddingTop: 10 }}>
            {expanded && (
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#d1d5db', padding: '0 8px', marginBottom: 6 }}>GENERAL</p>
            )}
            <button onClick={() => setShowLogout(true)}
              className="logout-nav"
              title={!expanded ? 'Sign out' : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: expanded ? 10 : 0, justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '9px 8px' : '9px', borderRadius: 10,
                border: 'none', background: 'transparent',
                color: '#ef4444', fontSize: 13, fontWeight: 500,
                transition: 'all .15s',
              }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: C.r50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <Svg d={IC.logout.d} size={14} />
              </div>
              {expanded && 'Sign Out'}
            </button>
          </div>
        </nav>

        {/* Admin label at bottom */}
        {expanded && (
          <div style={{
            margin: '0 8px 10px',
            padding: '14px 16px',
            background: C.g900,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'rgba(255,255,255,.12)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: '.02em' }}>
                {(user || 'A')[0].toUpperCase()}
              </span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {user || 'ADMIN'}
            </span>
          </div>
        )}
        {!expanded && (
          <div style={{ margin: '0 auto 14px', width: 40, height: 40, borderRadius: 10, background: C.g900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{(user || 'A')[0].toUpperCase()}</span>
          </div>
        )}
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────── */}
      <div style={{ marginLeft: SW, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', transition: 'margin-left .2s ease' }}>

        {/* Topbar */}
        <header style={{
          height: 64, background: C.white, borderBottom: `1px solid ${C.k100}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', gap: 12, position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: C.k900, margin: 0, whiteSpace: 'nowrap' }}>{title}</h1>
            <p style={{ fontSize: 11, color: C.k400, margin: 0 }}>
              {active === 0 ? 'Live System Overview' : `Showing latest ${title.toLowerCase()}`}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            {active === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.g50, padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.g100}`, color: C.g700 }}>
                <Svg d={IC.sync.d} size={13} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Auto-syncs every Mon 8:00 AM PHT</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {active !== 0 && (
                <button className="rbtn" onClick={() => loadTab(active)} disabled={tabLoading} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 8, border: `1px solid ${C.k200}`, background: C.white,
                  color: C.k500, fontSize: 13, fontWeight: 500, transition: 'all .15s',
                }}>
                  <Svg d={IC.refresh.d} size={13} />
                  Refresh
                </button>
              )}
              <button className="sbtn" onClick={handleSync} disabled={syncing} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                borderRadius: 8, border: 'none', background: C.g800, color: '#fff',
                fontSize: 13, fontWeight: 700, transition: 'all .15s', whiteSpace: 'nowrap',
                letterSpacing: '.02em',
              }}>
                <div style={{ animation: syncing ? 'spin .8s linear infinite' : 'none', display: 'flex' }}>
                  <Svg d={IC.sync.d} size={14} />
                </div>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* OVERVIEW */}
          {active === 0 && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(178px,1fr))', gap: 14 }}>
              <StatCard label="Total Scans" icon="scan" accent
                value={stats?.total_scans ?? '…'}
                sub="All time consumer scans"
                trend={stats?.total_scans != null ? `${stats.total_scans} Logged` : null}
                loading={statsLoading} />
              <StatCard label="Active Prices" icon="price"
                value={stats?.active_prices ?? '…'}
                sub={`of ${stats?.total_products ?? 3} commodities`}
                loading={statsLoading} />
              <StatCard label="Last Sync" icon="sync"
                value={statsLoading ? '…' : lastSyncDate}
                sub={stats?.last_sync?.extractor_used || 'Not yet synced'}
                trend={
                  stats?.last_sync?.status === 'success' ? '✓ Success' :
                    stats?.last_sync?.status === 'failed' ? '✗ Failed' : null
                }
                loading={statsLoading} />
              <StatCard label="Error Logs" icon="alert"
                value={stats?.total_errors ?? '…'}
                sub="Across all modules"
                loading={statsLoading} />
            </div>

            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.k900, marginBottom: 12 }}>Quick Access</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 10 }}>
                {NAV.slice(1).map(item => (
                  <button key={item.id} className="qb" onClick={() => setActive(item.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px',
                    borderRadius: 12, border: `1px solid ${C.k100}`, background: C.white,
                    textAlign: 'left', transition: 'all .15s', cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: C.g50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.g600, flexShrink: 0 }}>
                      <Svg d={IC[item.icon]?.d} d2={IC[item.icon]?.d2} size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.k900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.k400 }}>View →</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.k900, margin: 0 }}>Recent Scans</p>
                <button onClick={() => setActive(1)} style={{ fontSize: 12, color: C.g600, fontWeight: 600, border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  View all <Svg d={IC.arrow.d} size={11} />
                </button>
              </div>
              <RecentScans onUnauth={() => { logout(); navigate('/admin/login') }} />
            </div>
          </>)}

          {/* OPERATIONAL ANALYTICS */}
          {active === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {tabLoading ? <div style={{ padding: 40, textAlign: 'center', color: C.k400 }}>Loading analytics...</div> : <>
                <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.k100}`, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.k900 }}>Commodity Price Trends</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.prices || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.k100} />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: C.k500 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: C.k500 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v}`} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.k100}`, boxShadow: '0 4px 12px rgba(0,0,0,.08)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                        <Line type="monotone" dataKey="Whole Chicken" stroke={C.a700} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Tilapia (Local)" stroke={C.g600} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Pork Belly Liempo" stroke={C.r600} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
                  <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.k100}`, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.k900 }}>Detection Performance</h3>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.k400, background: C.k100, padding: '4px 10px', borderRadius: 6 }}>
                        Total: <span style={{ color: C.g700, fontWeight: 700 }}>{data?.scans?.total_scans?.toLocaleString() ?? 0}</span> scans
                      </span>
                    </div>
                    <div style={{ height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data?.scans?.detection_split || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            <Cell fill={C.g600} />
                            <Cell fill={C.a700} />
                            <Cell fill={C.r600} />
                          </Pie>
                          <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 8, border: `1px solid ${C.k100}` }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.k100}`, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                    {(() => {
                      const now = new Date();
                      const weekEnd = new Date(now);
                      weekEnd.setDate(weekEnd.getDate() - (volumeWeekOffset * 7));
                      const weekStart = new Date(weekEnd);
                      weekStart.setDate(weekStart.getDate() - 6);
                      const fmtShort = (d) => d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
                      const fmtISO = (d) => d.toISOString().slice(0, 10);
                      const isCurrentWeek = volumeWeekOffset === 0;

                      const handleWeekChange = async (offset) => {
                        setVolumeWeekOffset(offset);
                        if (offset === 0) {
                          setVolumeData(null);
                          return;
                        }
                        setVolumeLoading(true);
                        try {
                          const end = new Date();
                          end.setDate(end.getDate() - (offset * 7));
                          const start = new Date(end);
                          start.setDate(start.getDate() - 6);
                          const result = await getDailyVolume(fmtISO(start), fmtISO(end));
                          setVolumeData(result);
                        } catch (e) {
                          if (e.message === 'unauthorized') { logout(); navigate('/admin/login'); }
                        } finally {
                          setVolumeLoading(false);
                        }
                      };

                      const chartData = isCurrentWeek ? (data?.scans?.daily_volume || []) : (volumeData || []);

                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.k900 }}>Daily Scan Volume</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                onClick={() => handleWeekChange(volumeWeekOffset + 1)}
                                disabled={volumeLoading}
                                style={{
                                  width: 30, height: 30, borderRadius: 8,
                                  border: `1px solid ${C.k200}`, background: C.white,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: C.k500, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                                  transition: 'all .15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = C.k50}
                                onMouseLeave={e => e.currentTarget.style.background = C.white}
                              >←</button>
                              <span style={{
                                fontSize: 12, fontWeight: 600, color: C.k500,
                                background: C.k100, padding: '5px 12px', borderRadius: 6,
                                minWidth: 150, textAlign: 'center', whiteSpace: 'nowrap',
                              }}>
                                {fmtShort(weekStart)} — {fmtShort(weekEnd)}
                                {isCurrentWeek && <span style={{ color: C.g600, marginLeft: 4 }}>(Current)</span>}
                              </span>
                              <button
                                onClick={() => handleWeekChange(volumeWeekOffset - 1)}
                                disabled={isCurrentWeek || volumeLoading}
                                style={{
                                  width: 30, height: 30, borderRadius: 8,
                                  border: `1px solid ${C.k200}`, background: C.white,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: isCurrentWeek ? C.k200 : C.k500,
                                  cursor: isCurrentWeek ? 'not-allowed' : 'pointer',
                                  fontSize: 14, fontWeight: 700, transition: 'all .15s',
                                }}
                                onMouseEnter={e => !isCurrentWeek && (e.currentTarget.style.background = C.k50)}
                                onMouseLeave={e => e.currentTarget.style.background = C.white}
                              >→</button>
                            </div>
                          </div>
                          <div style={{ height: 250, position: 'relative' }}>
                            {volumeLoading && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.7)', zIndex: 5, borderRadius: 8 }}>
                                <span style={{ fontSize: 13, color: C.k400 }}>Loading...</span>
                              </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData}>
                                <defs>
                                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={C.g600} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={C.g600} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.k100} />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: C.k500 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: C.k500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.k100}` }} />
                                <Area type="monotone" dataKey="scans" stroke={C.g600} fillOpacity={1} fill="url(#colorScans)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.k100}`, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.k900 }}>Per-Commodity Detections</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.scans?.commodity_performance || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.k100} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.k500 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: C.k500 }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: C.k50 }} contentStyle={{ borderRadius: 8, border: `1px solid ${C.k100}` }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                        <Bar dataKey="Success" stackId="a" fill={C.g600} radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Low Confidence" stackId="a" fill={C.r600} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>}
            </div>
          )}

          {/* AI EVALUATION */}
          {active === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {tabLoading ? <div style={{ padding: 40, textAlign: 'center', color: C.k400 }}>Loading evaluations...</div> : <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(350px,1fr))', gap: 20 }}>
                  <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.k100}`, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.k900 }}>Model Performance Metrics</h3>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.k400, background: C.k100, padding: '4px 10px', borderRadius: 6 }}>
                        Version: <span style={{ color: C.g700 }}>{data?.models?.[data.models.length - 1]?.model_version || 'Unknown'}</span>
                      </span>
                    </div>
                    {(() => {
                      const latestModel = data?.models?.[data.models.length - 1] || {};
                      const metrics = [
                        {
                          label: 'Accuracy',
                          value: (latestModel.accuracy || 0) * 100,
                          color: C.g600,
                          bg: C.g50,
                          border: C.g100,
                          icon: '◎',
                          definition: 'Accuracy indicates that the model is making more accurate predictions.'
                        },
                        {
                          label: 'Precision',
                          value: (latestModel.precision || 0) * 100,
                          color: '#8b5cf6',
                          bg: '#f5f3ff',
                          border: '#ede9fe',
                          icon: '◉',
                          definition: 'Precision quantifies the proportion of true positives among all positive predictions, assessing the model\u0027s capability to avoid false positives.'
                        },
                        {
                          label: 'Recall',
                          value: (latestModel.recall || 0) * 100,
                          color: '#0891b2',
                          bg: '#ecfeff',
                          border: '#cffafe',
                          icon: '◈',
                          definition: 'Recall calculates the proportion of true positives among all actual positives, measuring the model\u0027s ability to detect all instances of a class.'
                        },
                        {
                          label: 'F1 Score',
                          value: (latestModel.f1_score || 0) * 100,
                          color: C.a700,
                          bg: C.a50,
                          border: C.a100,
                          icon: '◆',
                          definition: 'The F1 Score is the harmonic mean of precision and recall, providing a balanced assessment of a model\u0027s performance while considering both false positives and false negatives.'
                        },
                        {
                          label: 'Confidence',
                          value: (latestModel.avg_confidence || 0) * 100,
                          color: C.r600,
                          bg: C.r50,
                          border: C.r100,
                          icon: '◇',
                          definition: 'Confidence score is a value, typically between 0 and 1, that quantifies the model\u0027s confidence in its prediction. A higher confidence score indicates a higher level of certainty, while a lower score indicates less certainty.'
                        },
                      ];
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                          {metrics.map((m) => (
                            <div
                              key={m.label}
                              style={{
                                position: 'relative',
                                padding: '18px 16px',
                                borderRadius: 14,
                                border: `1px solid ${m.border}`,
                                background: m.bg,
                                cursor: 'default',
                                transition: 'all .2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}18`;
                                const tip = e.currentTarget.querySelector('.metric-tip');
                                if (tip) { tip.style.opacity = '1'; tip.style.visibility = 'visible'; tip.style.transform = 'translateX(-50%) translateY(0)'; }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                const tip = e.currentTarget.querySelector('.metric-tip');
                                if (tip) { tip.style.opacity = '0'; tip.style.visibility = 'hidden'; tip.style.transform = 'translateX(-50%) translateY(6px)'; }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <span style={{ fontSize: 16, color: m.color, lineHeight: 1 }}>{m.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '.04em' }}>{m.label}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                                <span style={{ fontSize: 28, fontWeight: 800, color: C.k900, lineHeight: 1 }}>{m.value.toFixed(1)}</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: C.k400 }}>%</span>
                              </div>
                              <div style={{
                                marginTop: 10, height: 5, borderRadius: 99,
                                background: `${m.color}20`, overflow: 'hidden',
                              }}>
                                <div style={{
                                  height: '100%', borderRadius: 99,
                                  background: m.color, width: `${Math.min(m.value, 100)}%`,
                                  transition: 'width .6s ease',
                                }} />
                              </div>
                              {/* Hover tooltip */}
                              <div
                                className="metric-tip"
                                style={{
                                  position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                                  transform: 'translateX(-50%) translateY(6px)',
                                  width: 240, padding: '12px 14px',
                                  background: C.k900, color: '#fff',
                                  fontSize: 12, lineHeight: 1.5, fontWeight: 400,
                                  borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.2)',
                                  opacity: 0, visibility: 'hidden',
                                  transition: 'all .2s ease', pointerEvents: 'none',
                                  zIndex: 50,
                                }}
                              >
                                <strong style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 700 }}>{m.label}</strong>
                                {m.definition}
                                <div style={{
                                  position: 'absolute', bottom: -5, left: '50%',
                                  width: 10, height: 10, background: C.k900,
                                  borderRadius: 2, transform: 'translateX(-50%) rotate(45deg)',
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.k100}`, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: C.k900 }}>Extraction Pipeline Metrics</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 340, overflowY: 'auto' }}>
                      {(data?.extractors || []).map((ext, i) => (
                        <div key={i} style={{ padding: 16, borderRadius: 12, border: `1px solid ${C.k100}`, background: C.k50 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <strong style={{ fontSize: 14, color: C.k900 }}>{ext.extractor_version}</strong>
                            <span style={{ fontSize: 12, color: C.k400 }}>{new Date(ext.created_at).toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, fontSize: 13 }}>
                            <div><span style={{ color: C.k500 }}>OCR Accuracy:</span> <span style={{ fontWeight: 600, color: C.g700, fontSize: 16 }}>{(ext.extraction_accuracy * 100).toFixed(1)}%</span></div>
                          </div>
                          <p style={{ margin: '8px 0 0', fontSize: 12, color: C.k500, fontStyle: 'italic' }}>"{ext.notes}"</p>
                        </div>
                      ))}
                      {(!data?.extractors || data.extractors.length === 0) && (
                        <p style={{ fontSize: 13, color: C.k500, textAlign: 'center', padding: 20 }}>No extraction evaluation records found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>}
            </div>
          )}

          {/* VIOLATIONS */}
          {active === 7 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <ViolationsForm
                onSubmit={() => loadTab(7)}
                onUnauth={() => { logout(); navigate('/admin/login') }}
              />

              <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.k100}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                <div style={{ padding: '15px 20px', borderBottom: `1px solid ${C.k100}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: C.g50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.g600 }}>
                    <Svg d={IC.violation.d} size={16} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.k900 }}>Consumer Complaints</p>
                    <p style={{ margin: 0, fontSize: 12, color: C.k400 }}>
                      {tabLoading ? 'Loading...' : `${Array.isArray(data) ? data.length : 0} complaint${Array.isArray(data) && data.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <DataTable columns={COLS[7] || []} rows={Array.isArray(data) ? data : []} loading={tabLoading} />
              </div>
            </div>
          )}

          {/* DATA TABS (Scan Logs, Price Records, etc.) */}
          {active !== 0 && active !== 5 && active !== 6 && active !== 7 && (
            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.k100}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: `1px solid ${C.k100}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: C.g50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.g600 }}>
                  <Svg d={IC[NAV.find(n => n.id === active)?.icon]?.d} d2={IC[NAV.find(n => n.id === active)?.icon]?.d2} size={16} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.k900 }}>{title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.k400 }}>
                    {tabLoading ? 'Loading...' : `${Array.isArray(data) ? data.length : 0} record${Array.isArray(data) && data.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              <DataTable columns={COLS[active] || []} rows={Array.isArray(data) ? data : []} loading={tabLoading} />
            </div>
          )}
        </main>
      </div>

      <Toast toast={toast} />
      {showLogout && <LogoutModal onConfirm={() => { logout(); navigate('/admin/login') }} onCancel={() => setShowLogout(false)} />}
      {showEditModal && editingViolation && (
        <EditViolationModal
          violation={editingViolation}
          onSave={() => {
            setShowEditModal(false)
            setEditingViolation(null)
            setToast({ type: 'ok', text: 'Violation updated successfully' })
            loadTab(7)
            setTimeout(() => setToast(null), 3000)
          }}
          onCancel={() => {
            setShowEditModal(false)
            setEditingViolation(null)
          }}
          onUnauth={() => { logout(); navigate('/admin/login') }}
        />
      )}
    </div>
  )
}