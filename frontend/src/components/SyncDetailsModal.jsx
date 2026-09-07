import React, { useState, useMemo } from 'react'

const C = {
  g900: '#052e16', g800: '#14532d', g700: '#166534', g600: '#16a34a',
  g500: '#22c55e', g100: '#dcfce7', g50: '#f0fdf4',
  k900: '#111827', k800: '#1f2937', k700: '#374151', k500: '#6b7280', k400: '#9ca3af', k200: '#e5e7eb', k100: '#f3f4f6', k50: '#f9fafb',
  white: '#ffffff',
  red50: '#fef2f2', red600: '#dc2626', red700: '#b91c1c', red100: '#fee2e2',
  blue50: '#eff6ff', blue600: '#2563eb', blue700: '#1d4ed8', blue100: '#dbeafe',
  purple50: '#faf5ff', purple700: '#7e22ce', purple100: '#f3e8ff'
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

const fmtDateShort = (dtStr) => {
  if (!dtStr) return ''
  try {
    return new Date(dtStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dtStr
  }
}

export default function SyncDetailsModal({ syncLog, onClose }) {
  const [search, setSearch] = useState('')
  const [movementFilter, setMovementFilter] = useState('all') // 'all' | 'changed' | 'increased' | 'decreased' | 'unchanged'
  const [selectedCategory, setSelectedCategory] = useState('all')

  if (!syncLog) return null

  const details = syncLog.details || []

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set()
    details.forEach(item => {
      if (item.category) set.add(item.category)
    })
    return ['all', ...Array.from(set)]
  }, [details])

  // Summary statistics
  const stats = useMemo(() => {
    let inc = 0, dec = 0, unch = 0, newItems = 0
    details.forEach(item => {
      if (item.price_from == null) {
        newItems++
      } else if (item.price_change > 0) {
        inc++
      } else if (item.price_change < 0) {
        dec++
      } else {
        unch++
      }
    })
    return { total: details.length, inc, dec, unch, newItems }
  }, [details])

  // Filtered items
  const filteredDetails = useMemo(() => {
    return details.filter(item => {
      // Search text
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = (item.product || '').toLowerCase().includes(q)
        const matchCat = (item.category || '').toLowerCase().includes(q)
        if (!matchName && !matchCat) return false
      }

      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false
      }

      // Movement filter
      if (movementFilter === 'changed') return item.price_change !== 0 && item.price_from != null
      if (movementFilter === 'increased') return item.price_change > 0
      if (movementFilter === 'decreased') return item.price_change < 0
      if (movementFilter === 'unchanged') return item.price_change === 0 && item.price_from != null
      if (movementFilter === 'new') return item.price_from == null

      return true
    })
  }, [details, search, selectedCategory, movementFilter])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.6)',
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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          maxWidth: 780, width: '100%',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
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
            position: 'relative',
            flexShrink: 0
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

          <h2 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Synchronization & Price Comparison
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#dcfce7', opacity: 0.9 }}>
            Executed on {fmtDt(syncLog.synced_at)} via <strong style={{ color: '#fff' }}>{syncLog.extractor_used === 'sheet' ? 'DA Google Sheet Sync' : (syncLog.extractor_used || 'DA Sheet')}</strong>
          </p>
        </div>

        {/* Top Summary Bar & Stat Pills */}
        <div style={{
          padding: '14px 28px',
          background: C.k50,
          borderBottom: `1px solid ${C.k200}`,
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0
        }}>
          {/* Stat Pill Counters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontSize: 12, fontWeight: 700, color: C.k700,
              background: C.white, border: `1px solid ${C.k200}`,
              padding: '4px 10px', borderRadius: 20
            }}>
              Total: {stats.total} items
            </span>

            {stats.inc > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: C.g700,
                background: C.g50, border: `1px solid ${C.g100}`,
                padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                ▲ {stats.inc} Increased
              </span>
            )}

            {stats.dec > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: C.red700,
                background: C.red50, border: `1px solid ${C.red100}`,
                padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                ▼ {stats.dec} Decreased
              </span>
            )}

            {stats.unch > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: C.k500,
                background: C.k100, border: `1px solid ${C.k200}`,
                padding: '4px 10px', borderRadius: 20
              }}>
                — {stats.unch} Unchanged
              </span>
            )}

            {stats.newItems > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: C.purple700,
                background: C.purple50, border: `1px solid ${C.purple100}`,
                padding: '4px 10px', borderRadius: 20
              }}>
                ✨ {stats.newItems} New
              </span>
            )}
          </div>

          {syncLog.pdf_url && (
            <a
              href={syncLog.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: C.g600, fontWeight: 600, textDecoration: 'none',
                fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4
              }}
            >
              📊 Source Sheet ↗
            </a>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div style={{
          padding: '14px 28px',
          background: C.white,
          borderBottom: `1px solid ${C.k200}`,
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
            <input
              type="text"
              placeholder="Search commodity name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '7px 12px 7px 32px', borderRadius: 8,
                border: `1px solid ${C.k200}`, fontSize: 13, color: C.k900,
                outline: 'none', background: C.k50
              }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.k400, fontSize: 13 }}>
              🔍
            </span>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {/* Movement Filter Pills */}
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.k200}`,
                fontSize: 12, fontWeight: 600, color: C.k700, background: C.white, cursor: 'pointer'
              }}
            >
              <option value="all">All Movements ({details.length})</option>
              <option value="changed">Price Changed Only ({stats.inc + stats.dec})</option>
              <option value="increased">Price Increased (▲ {stats.inc})</option>
              <option value="decreased">Price Decreased (▼ {stats.dec})</option>
              <option value="unchanged">Unchanged (— {stats.unch})</option>
              {stats.newItems > 0 && <option value="new">New Commodities ({stats.newItems})</option>}
            </select>

            {/* Category Filter */}
            {categories.length > 2 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.k200}`,
                  fontSize: 12, fontWeight: 600, color: C.k700, background: C.white, cursor: 'pointer'
                }}
              >
                <option value="all">All Categories</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Body Content - Commodity Price Comparisons */}
        <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1 }}>
          {filteredDetails.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center', background: C.k50,
              borderRadius: 12, border: `1px dashed ${C.k200}`, color: C.k500, fontSize: 13
            }}>
              No commodity price records match your search or filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredDetails.map((item, idx) => {
                const pFrom = item.price_from != null ? Number(item.price_from) : null
                const pTo = item.price_to != null ? Number(item.price_to) : null
                const pDiff = item.price_change != null ? Number(item.price_change) : null
                const pPct = item.price_change_pct != null ? Number(item.price_change_pct) : null
                const pLow = item.price_low != null ? Number(item.price_low) : null
                const pHigh = item.price_high != null ? Number(item.price_high) : null

                const isIncreased = pDiff != null && pDiff > 0
                const isDecreased = pDiff != null && pDiff < 0
                const isUnchanged = pDiff != null && pDiff === 0
                const isNew = pFrom == null

                return (
                  <div
                    key={idx}
                    style={{
                      background: isIncreased ? '#f0fdf4' : isDecreased ? '#fef2f2' : C.white,
                      border: `1px solid ${isIncreased ? '#bbf7d0' : isDecreased ? '#fecdd3' : C.k200}`,
                      borderRadius: 12,
                      padding: '14px 18px',
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'transform .1s ease, box-shadow .1s ease'
                    }}
                  >
                    {/* Left: Product Name & Category */}
                    <div style={{ minWidth: 200, flex: '1 1 200px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.k900, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{item.product}</span>
                        {item.category && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: C.g700, background: C.g50,
                            border: `1px solid ${C.g100}`, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase'
                          }}>
                            {item.category}
                          </span>
                        )}
                      </div>
                      
                      {/* Sub-label for range or prev date */}
                      <div style={{ fontSize: 11, color: C.k500, marginTop: 4, display: 'flex', gap: 10 }}>
                        {item.prev_date && (
                          <span>Prev record: {fmtDateShort(item.prev_date)}</span>
                        )}
                        {(pLow !== null || pHigh !== null) && (
                          <span>Range: ₱{(pLow ?? pTo).toFixed(2)} – ₱{(pHigh ?? pTo).toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Price Transition (Price from last month -> Current month) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      {/* Price from last month */}
                      {!isNew && pFrom !== null && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: C.k400, display: 'block', textTransform: 'uppercase' }}>
                            Last Month / Sync
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.k500, textDecoration: pDiff !== 0 ? 'line-through' : 'none' }}>
                            ₱{pFrom.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Transition Arrow */}
                      {!isNew && (
                        <div style={{ fontSize: 14, color: C.k400, fontWeight: 700 }}>
                          →
                        </div>
                      )}

                      {/* Current Synced Price */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: isIncreased ? C.g700 : isDecreased ? C.red700 : C.k500, display: 'block', textTransform: 'uppercase' }}>
                          Current Synced
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: isIncreased ? C.g700 : isDecreased ? C.red700 : C.k900 }}>
                          {pTo != null ? `₱${pTo.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>

                      {/* Movement Badge Pill */}
                      <div style={{ minWidth: 110, textAlign: 'right' }}>
                        {isNew && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                            background: C.purple50, color: C.purple700, border: `1px solid ${C.purple100}`
                          }}>
                            ✨ Initial Sync
                          </span>
                        )}

                        {isIncreased && (
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                            background: C.g100, color: C.g700, border: `1px solid ${C.g500}`,
                            display: 'inline-flex', alignItems: 'center', gap: 3
                          }}>
                            ▲ +₱{pDiff.toFixed(2)} ({pPct > 0 ? `+${pPct}%` : `${pPct}%`})
                          </span>
                        )}

                        {isDecreased && (
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                            background: C.red100, color: C.red700, border: `1px solid ${C.red600}`,
                            display: 'inline-flex', alignItems: 'center', gap: 3
                          }}>
                            ▼ ₱{pDiff.toFixed(2)} ({pPct}% )
                          </span>
                        )}

                        {isUnchanged && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                            background: C.k100, color: C.k500, border: `1px solid ${C.k200}`
                          }}>
                            — Unchanged
                          </span>
                        )}
                      </div>
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
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: 12, color: C.k500 }}>
            Showing {filteredDetails.length} of {details.length} commodities
          </span>

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
