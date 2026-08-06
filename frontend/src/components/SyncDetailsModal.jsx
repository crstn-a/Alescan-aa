import React from 'react'

const C = {
  g900: '#052e16', g800: '#14532d', g700: '#166534', g600: '#16a34a',
  g500: '#22c55e', g100: '#dcfce7', g50: '#f0fdf4',
  k900: '#111827', k800: '#1f2937', k700: '#374151', k500: '#6b7280', k400: '#9ca3af', k200: '#e5e7eb', k100: '#f3f4f6', k50: '#f9fafb',
  white: '#ffffff',
  red50: '#fef2f2', red600: '#dc2626', red700: '#b91c1c', red100: '#fee2e2'
}

const fmtDt = (dtStr) => {
  if (!dtStr) return '—'
  try {
    return new Date(dtStr).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  } catch {
    return dtStr
  }
}

export default function SyncDetailsModal({ syncLog, onClose }) {
  if (!syncLog) return null

  const details = syncLog.details || []

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn .2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: 640, width: '100%',
          border: `1px solid ${C.k200}`,
          overflow: 'hidden',
          animation: 'popIn .25s cubic-bezier(.17,.67,.83,.67)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #052e16 0%, #166534 100%)',
            padding: '24px 28px',
            color: '#fff',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 18, right: 18,
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none', color: '#fff',
              width: 32, height: 32, borderRadius: '50%',
              fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            ✕
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              background: 'rgba(34, 197, 94, 0.25)', color: '#4ade80',
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.5px', textTransform: 'uppercase'
            }}>
              Sync Details
            </span>
            <span style={{ fontSize: 12, color: '#bbf7d0', opacity: 0.9 }}>
              Log #{syncLog.id}
            </span>
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Synchronization Price Details
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#dcfce7', opacity: 0.9 }}>
            Executed on {fmtDt(syncLog.synced_at)} via <strong style={{ color: '#fff' }}>{syncLog.extractor_used || 'llamaparse'}</strong>
          </p>
        </div>

        {/* Metadata summary bar */}
        <div style={{
          padding: '14px 28px',
          background: C.k50,
          borderBottom: `1px solid ${C.k200}`,
          display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
          fontSize: 13
        }}>
          <div>
            <span style={{ color: C.k500, fontSize: 12, display: 'block' }}>Status</span>
            <span style={{
              fontWeight: 700,
              color: syncLog.status === 'success' ? C.g700 : C.red700
            }}>
              {syncLog.status === 'success' ? '✓ Successful' : '✗ Failed'}
            </span>
          </div>

          <div>
            <span style={{ color: C.k500, fontSize: 12, display: 'block' }}>Notes</span>
            <span style={{ fontWeight: 600, color: C.k900 }}>
              {syncLog.notes || '—'}
            </span>
          </div>

          {syncLog.pdf_url && (
            <div style={{ marginLeft: 'auto' }}>
              <a
                href={syncLog.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: C.g600, fontWeight: 600, textDecoration: 'none',
                  fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4
                }}
              >
                📄 View Source PDF ↗
              </a>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px 28px', maxHeight: '55vh', overflowY: 'auto' }}>
          <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: C.k900, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Price Changes Breakdown</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.k500 }}>(Price from → to latest price)</span>
          </h4>

          {details.length === 0 ? (
            <div style={{
              padding: '30px 20px', textAlign: 'center', background: C.k50,
              borderRadius: 12, border: `1px dashed ${C.k200}`, color: C.k500, fontSize: 13
            }}>
              No specific price records logged for this synchronization run.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {details.map((item, idx) => {
                const pFrom = item.price_from != null ? Number(item.price_from) : null
                const pTo = item.price_to != null ? Number(item.price_to) : null
                
                let diffText = ''
                let diffBg = C.k100
                let diffColor = C.k700

                if (pFrom != null && pTo != null) {
                  const diff = pTo - pFrom
                  if (diff > 0) {
                    diffText = `+₱${diff.toFixed(2)}`
                    diffBg = '#fef2f2'
                    diffColor = C.red700
                  } else if (diff < 0) {
                    diffText = `-₱${Math.abs(diff).toFixed(2)}`
                    diffBg = C.g100
                    diffColor = C.g700
                  } else {
                    diffText = 'No Change'
                    diffBg = C.k100
                    diffColor = C.k500
                  }
                } else if (pFrom == null && pTo != null) {
                  diffText = 'New'
                  diffBg = C.g100
                  diffColor = C.g700
                }

                return (
                  <div
                    key={idx}
                    style={{
                      background: C.white,
                      border: `1px solid ${C.k200}`,
                      borderRadius: 12,
                      padding: '14px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.k900 }}>
                        {item.product}
                      </div>
                      <div style={{ fontSize: 12, color: C.k500, marginTop: 2 }}>
                        Official SRP Update
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Price Transition */}
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11, color: C.k400, display: 'block' }}>From</span>
                          <span style={{ fontSize: 13.5, color: C.k500, fontWeight: 500 }}>
                            {pFrom != null ? `₱${pFrom.toFixed(2)}` : 'N/A'}
                          </span>
                        </div>

                        <span style={{ color: C.g600, fontSize: 16, fontWeight: 700 }}>→</span>

                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: 11, color: C.g700, fontWeight: 600, display: 'block' }}>Latest Price</span>
                          <span style={{ fontSize: 15, color: C.g700, fontWeight: 800 }}>
                            {pTo != null ? `₱${pTo.toFixed(2)}` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Diff pill */}
                      {diffText && (
                        <span style={{
                          background: diffBg, color: diffColor,
                          padding: '4px 10px', borderRadius: 20,
                          fontSize: 12, fontWeight: 700,
                          minWidth: 70, textAlign: 'center'
                        }}>
                          {diffText}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            background: C.k50,
            borderTop: `1px solid ${C.k200}`,
            display: 'flex', justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 22px', borderRadius: 10,
              background: C.g600, color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background .15s'
            }}
            onMouseEnter={(e) => e.target.style.background = C.g700}
            onMouseLeave={(e) => e.target.style.background = C.g600}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
