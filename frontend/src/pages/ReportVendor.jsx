// frontend/src/pages/ReportVendor.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserAuth } from '../hooks/useUserAuth'
import { submitReport, getMyReports } from '../api/reportApi'

const C = {
  primary:      '#22c55e',
  primaryDark:  '#16a34a',
  g900:         '#052e16',
  g800:         '#14532d',
  g700:         '#166534',
  g100:         '#dcfce7',
  g50:          '#f0fdf4',
  bg:           '#f9fafb',
  surface:      '#ffffff',
  border:       '#f3f4f6',
  text:         '#111827',
  textSecondary:'#6b7280',
  textMuted:    '#9ca3af',
  error:        '#ef4444',
  errorBg:      '#fef2f2',
  errorBorder:  '#fee2e2',
  errorDark:    '#991b1b',
  amber50:      '#fffbeb',
  amber700:     '#b45309',
  amber100:     '#fef3c7',
  blue50:       '#eff6ff',
  blue700:      '#1d4ed8',
  blue100:      '#dbeafe',
}

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

function StatusBadge({ status }) {
  const m = {
    pending:   { bg: C.amber50,  color: C.amber700, border: C.amber100, label: 'Pending' },
    reviewing: { bg: C.blue50,   color: C.blue700,  border: C.blue100,  label: 'Reviewing' },
    resolved:  { bg: C.g50,      color: C.g700,     border: C.g100,     label: 'Resolved' },
    dismissed: { bg: '#f9fafb',  color: '#6b7280',  border: '#e5e7eb',  label: 'Dismissed' },
  }
  const s = m[status] || m.pending
  return (
    <span style={{
      display:'inline-block', fontSize:11, fontWeight:700,
      padding:'3px 10px', borderRadius:99, whiteSpace:'nowrap',
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
    }}>{s.label}</span>
  )
}

const fmtDt = (ts) => ts
  ? new Date(ts).toLocaleString('en-PH', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
  : '—'

export default function ReportVendor() {
  const navigate = useNavigate()
  const { authed, user, logout } = useUserAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authed) navigate('/user/login')
  }, [authed, navigate])

  const [form, setForm] = useState({
    vendor_name: '', store_number: '', commodity_name: '', price_seen: '', complaint_description: '',
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [successTicket, setSuccessTicket] = useState(null)
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('form') // 'form' | 'history'
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const loadReports = useCallback(async () => {
    if (!authed) return
    setReportsLoading(true)
    try {
      const data = await getMyReports()
      setReports(data)
    } catch (e) {
      if (e.message === 'unauthorized') { logout(); return }
      console.error('Failed to load reports:', e)
    } finally {
      setReportsLoading(false)
    }
  }, [authed, logout])

  useEffect(() => { loadReports() }, [loadReports])

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    setSuccessTicket(null)

    try {
      const fd = new FormData()
      fd.append('vendor_name', form.vendor_name)
      fd.append('store_number', form.store_number)
      fd.append('commodity_name', form.commodity_name)
      fd.append('price_seen', form.price_seen)
      fd.append('complaint_description', form.complaint_description)
      if (image) fd.append('image', image)

      const result = await submitReport(fd)
      setSuccessTicket(result.ticket_number)
      setForm({ vendor_name: '', store_number: '', commodity_name: '', price_seen: '', complaint_description: '' })
      setImage(null)
      setImagePreview(null)
      loadReports()
    } catch (e) {
      if (e.message === 'unauthorized') { logout(); return }
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!authed) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        button,input,textarea,select{font-family:inherit}
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .report-input {
          width:100%; padding:12px 16px;
          border:1.5px solid ${C.border}; border-radius:12px;
          background:${C.surface}; color:${C.text}; font-size:15px;
          outline:none; transition:border-color .15s, box-shadow .15s;
        }
        .report-input:focus {
          border-color:${C.g800};
          box-shadow:0 0 0 3px rgba(20,83,45,0.12);
        }
        .report-input::placeholder { color:${C.textMuted}; }
        textarea.report-input { min-height:100px; resize:vertical; line-height:1.6; }
        .submit-btn {
          padding:14px 32px; border-radius:12px; border:none;
          background:${C.g800}; color:#fff; font-size:16px; font-weight:700;
          cursor:pointer; transition:all .15s; letter-spacing:.02em;
        }
        .submit-btn:hover:not(:disabled) {
          background:${C.g700};
          transform:translateY(-1px);
          box-shadow:0 6px 20px rgba(22,101,52,.35);
        }
        .submit-btn:disabled { opacity:.6; cursor:not-allowed; }
        .tab-btn {
          padding:10px 20px; border-radius:10px; border:none;
          font-size:14px; font-weight:600; cursor:pointer;
          transition:all .15s;
        }
        .report-card { transition:all .15s; }
        .report-card:hover { transform:translateY(-1px); box-shadow:0 8px 20px -6px rgba(0,0,0,.1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        @media (max-width: 640px) {
          .report-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1000,
          margin: '0 auto',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <img src="/Alescan-Logo.png" alt="Alescan" style={{ width:36, height:36, objectFit:'contain' }} />
            <span style={{ fontSize:18, fontWeight:800, color:C.g900, letterSpacing:'.02em' }}>ALESCAN</span>
          </a>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>
                {user?.first_name} {user?.last_name}
              </p>
              <p style={{ fontSize:11, color:C.textMuted, margin:0 }}>{user?.email}</p>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              style={{
                padding:'8px 16px', borderRadius:8, border:`1px solid ${C.border}`,
                background:C.surface, color:C.textSecondary, fontSize:13, fontWeight:600,
                cursor:'pointer', transition:'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.errorBg; e.currentTarget.style.color = C.errorDark; e.currentTarget.style.borderColor = C.errorBorder }}
              onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.textSecondary; e.currentTarget.style.borderColor = C.border }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {/* Page Title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.g900, marginBottom: 6 }}>Report a Vendor</h1>
          <p style={{ fontSize: 15, color: C.textSecondary, margin: 0 }}>
            Submit a report if a vendor is selling above the suggested retail price (SRP).
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display:'flex', gap:8, marginBottom:28, background:C.surface, padding:6, borderRadius:14, border:`1px solid ${C.border}`, width:'fit-content' }}>
          <button
            className="tab-btn"
            onClick={() => setActiveTab('form')}
            style={{
              background: activeTab === 'form' ? C.g800 : 'transparent',
              color: activeTab === 'form' ? '#fff' : C.textSecondary,
            }}
          >
            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8M16 17H8M10 9H8" size={16} />
              New Report
            </span>
          </button>
          <button
            className="tab-btn"
            onClick={() => setActiveTab('history')}
            style={{
              background: activeTab === 'history' ? C.g800 : 'transparent',
              color: activeTab === 'history' ? '#fff' : C.textSecondary,
            }}
          >
            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Icon d="M12 8v4l3 3 M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" size={16} />
              My Reports
              {reports.length > 0 && (
                <span style={{
                  background: activeTab === 'history' ? 'rgba(255,255,255,.2)' : C.g50,
                  color: activeTab === 'history' ? '#fff' : C.g700,
                  fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99,
                }}>{reports.length}</span>
              )}
            </span>
          </button>
        </div>

        {/* ── New Report Form ── */}
        {activeTab === 'form' && (
          <div style={{ animation:'fadeUp .3s ease' }}>

            {/* Success message */}
            {successTicket && (
              <div style={{
                padding:'20px 24px', borderRadius:16, background:C.g50,
                border:`1.5px solid ${C.g100}`, marginBottom:24,
                display:'flex', alignItems:'flex-start', gap:14,
              }}>
                <div style={{
                  width:44, height:44, borderRadius:12, background:C.surface,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  border:`1px solid ${C.g100}`, flexShrink:0,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.primaryDark} strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                </div>
                <div>
                  <p style={{ fontSize:16, fontWeight:700, color:C.g900, margin:'0 0 4px' }}>Report Submitted Successfully!</p>
                  <p style={{ fontSize:14, color:C.textSecondary, margin:'0 0 8px' }}>
                    Your report has been filed and assigned ticket number:
                  </p>
                  <span style={{
                    display:'inline-block', fontSize:16, fontWeight:800, color:C.g800,
                    background:C.surface, padding:'6px 16px', borderRadius:10,
                    border:`1.5px solid ${C.g100}`, letterSpacing:'.04em',
                  }}>{successTicket}</span>
                  <p style={{ fontSize:13, color:C.textMuted, margin:'10px 0 0' }}>
                    A Market Officer will review your report. You can track the status in "My Reports".
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{
              background: C.surface,
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              padding: 'clamp(24px,4vw,36px)',
              boxShadow: '0 1px 4px rgba(0,0,0,.04)',
            }}>
              <div className="report-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

                {/* Vendor Name */}
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:8 }}>
                    Vendor / Store Name <span style={{ color:C.error }}>*</span>
                  </label>
                  <input className="report-input" type="text" value={form.vendor_name} onChange={update('vendor_name')} placeholder="e.g. Maria's Stall" required />
                </div>

                {/* Store Number */}
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:8 }}>
                    Store Number / Location <span style={{ color:C.error }}>*</span>
                  </label>
                  <input className="report-input" type="text" value={form.store_number} onChange={update('store_number')} placeholder="e.g. Stall #42, Section B" required />
                </div>

                {/* Commodity */}
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:8 }}>
                    Commodity Name <span style={{ color:C.error }}>*</span>
                  </label>
                  <input className="report-input" type="text" value={form.commodity_name} onChange={update('commodity_name')} placeholder="e.g. Galunggong, Rice, Pork" required />
                </div>

                {/* Price Seen */}
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:8 }}>
                    Price Seen (₱) <span style={{ color:C.error }}>*</span>
                  </label>
                  <input className="report-input" type="number" step="0.01" min="0" value={form.price_seen} onChange={update('price_seen')} placeholder="e.g. 250.00" required />
                </div>
              </div>

              {/* Complaint Description — full width */}
              <div style={{ marginTop:20 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:8 }}>
                  Description of Complaint <span style={{ color:C.error }}>*</span>
                </label>
                <textarea className="report-input" value={form.complaint_description} onChange={update('complaint_description')} placeholder="Describe why you believe the price is too high. Include any relevant details." required />
              </div>

              {/* Image Upload */}
              <div style={{ marginTop:20 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:8 }}>
                  Photo Evidence <span style={{ color:C.textMuted, fontWeight:400 }}>(optional)</span>
                </label>
                <div style={{
                  border:`2px dashed ${C.border}`, borderRadius:14, padding:24,
                  textAlign:'center', cursor:'pointer', transition:'all .15s',
                  background: imagePreview ? 'transparent' : C.bg,
                }}
                  onClick={() => document.getElementById('report-image-input')?.click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.primaryDark}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  {imagePreview ? (
                    <div style={{ position:'relative', display:'inline-block' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxHeight:180, maxWidth:'100%', borderRadius:10, objectFit:'contain' }} />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImage(null); setImagePreview(null) }} style={{
                        position:'absolute', top:-8, right:-8, width:28, height:28, borderRadius:'50%',
                        background:C.error, color:'#fff', border:'none', cursor:'pointer', fontSize:14, fontWeight:700,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>×</button>
                    </div>
                  ) : (
                    <div>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" style={{ marginBottom:8 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <p style={{ fontSize:14, color:C.textSecondary, margin:0 }}>
                        Click to upload a photo of the price tag or product
                      </p>
                      <p style={{ fontSize:12, color:C.textMuted, margin:'4px 0 0' }}>JPG, PNG up to 10MB</p>
                    </div>
                  )}
                  <input id="report-image-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display:'none' }} />
                </div>
              </div>

              {/* Error */}
              {submitError && (
                <div style={{ padding:'12px 16px', borderRadius:12, background:C.errorBg, border:`1px solid ${C.errorBorder}`, display:'flex', alignItems:'center', gap:10, marginTop:20 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ fontSize:14, color:C.errorDark, margin:0, fontWeight:600 }}>{submitError}</p>
                </div>
              )}

              {/* Submit */}
              <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
                <button type="submit" className="submit-btn" disabled={submitting || !form.vendor_name || !form.store_number || !form.commodity_name || !form.price_seen || !form.complaint_description}>
                  {submitting ? (
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:18, height:18, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />
                      Submitting...
                    </span>
                  ) : (
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Icon d="M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z" size={18} />
                      Submit Report
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── My Reports History ── */}
        {activeTab === 'history' && (
          <div style={{ animation:'fadeUp .3s ease' }}>
            {reportsLoading ? (
              <div style={{ padding:60, textAlign:'center', color:C.textMuted }}>
                <div style={{ width:24, height:24, border:`2.5px solid ${C.border}`, borderTopColor:C.primaryDark, borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 12px' }} />
                <p style={{ fontSize:14 }}>Loading your reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div style={{
                padding:60, textAlign:'center',
                background:C.surface, borderRadius:18, border:`1px solid ${C.border}`,
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.2" style={{ marginBottom:16 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>
                </svg>
                <p style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:4 }}>No reports yet</p>
                <p style={{ fontSize:14, color:C.textSecondary }}>Submit your first vendor report to see it here.</p>
                <button onClick={() => setActiveTab('form')} style={{
                  marginTop:16, padding:'10px 24px', borderRadius:10, border:'none',
                  background:C.g800, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer',
                }}>Create a Report</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {reports.map(r => (
                  <div key={r.id} className="report-card" style={{
                    background:C.surface, borderRadius:16, border:`1px solid ${C.border}`,
                    padding:'20px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.04)',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{
                          fontSize:13, fontWeight:800, color:C.g800,
                          background:C.g50, padding:'4px 12px', borderRadius:8,
                          border:`1px solid ${C.g100}`, letterSpacing:'.03em',
                        }}>{r.ticket_number}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <span style={{ fontSize:12, color:C.textMuted }}>{fmtDt(r.created_at)}</span>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>Vendor</p>
                        <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>{r.vendor_name}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>Store #</p>
                        <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>{r.store_number}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>Commodity</p>
                        <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>{r.commodity_name}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>Price Seen</p>
                        <p style={{ fontSize:14, fontWeight:700, color:C.error, margin:0 }}>₱{Number(r.price_seen).toFixed(2)}</p>
                      </div>
                    </div>

                    <p style={{ fontSize:13, color:C.textSecondary, lineHeight:1.6, margin:0 }}>{r.complaint_description}</p>

                    {r.officer_notes && (
                      <div style={{ marginTop:12, padding:'12px 16px', borderRadius:10, background:C.g50, border:`1px solid ${C.g100}` }}>
                        <p style={{ fontSize:11, fontWeight:700, color:C.g700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Officer Notes</p>
                        <p style={{ fontSize:13, color:C.g900, margin:0, lineHeight:1.6 }}>{r.officer_notes}</p>
                      </div>
                    )}

                    {r.image_url && (
                      <div style={{ marginTop:12 }}>
                        <img src={r.image_url} alt="Evidence" style={{ maxHeight:120, borderRadius:10, objectFit:'cover', border:`1px solid ${C.border}` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => {
            setShowLogoutModal(false)
            logout()
            navigate('/')
          }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  )
}

/* ── Logout Modal Component ── */
function LogoutModal({ onConfirm, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn .15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface,
          borderRadius: 20,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 380,
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          border: `1px solid ${C.border}`,
          animation: 'scaleIn .18s ease',
        }}
      >
        <div style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: C.errorBg,
          border: `1px solid ${C.errorBorder}`,
          margin: '0 auto 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.errorDark,
        }}>
          <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" size={26} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.g900, margin: '0 0 8px' }}>Log Out?</h2>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: '0 0 24px', lineHeight: 1.5 }}>
          Are you sure you want to log out of your account? You will need to sign in again to submit or view vendor reports.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.surface,
              fontSize: 14,
              fontWeight: 600,
              color: C.textSecondary,
              cursor: 'pointer',
              transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.bg}
            onMouseLeave={e => e.currentTarget.style.background = C.surface}
          >
            No, stay
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 10,
              border: 'none',
              background: C.error,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
              transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.errorDark}
            onMouseLeave={e => e.currentTarget.style.background = C.error}
          >
            Yes, log out
          </button>
        </div>
      </div>
    </div>
  )
}
