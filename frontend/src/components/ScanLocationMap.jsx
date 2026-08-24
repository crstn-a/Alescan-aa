import { useEffect, useRef, useState, useCallback } from 'react'
import { getLocationLogs } from '../api/adminApi'

const C = {
  g900: '#052e16', g800: '#14532d', g700: '#166534', g600: '#16a34a',
  g500: '#22c55e', g100: '#dcfce7', g50: '#f0fdf4',
  k900: '#111827', k700: '#374151', k500: '#6b7280', k400: '#9ca3af',
  k200: '#e5e7eb', k100: '#f3f4f6', k50: '#f9fafb', white: '#ffffff',
  accent: '#22c55e',
  blue: '#3b82f6',
}

export default function ScanLocationMap() {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})

  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [selectedCommodity, setSelectedCommodity] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [selectedScan, setSelectedScan] = useState(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Dynamically load Leaflet CSS & JS
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true)
      return
    }

    const cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(cssLink)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Fetch location data from API
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getLocationLogs(250)
      setLocations(data || [])
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to fetch location logs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
    const interval = setInterval(fetchLocations, 5000) // 5s real-time auto-refresh
    return () => clearInterval(interval)
  }, [fetchLocations])

  // Filtered locations
  const filteredLocations = locations.filter((loc) => {
    if (!loc.latitude || !loc.longitude) return false

    // Commodity filter
    if (selectedCommodity !== 'ALL') {
      const prodName = loc.products?.display_name || 'Unknown'
      if (prodName !== selectedCommodity) return false
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const scanDate = new Date(loc.scanned_at)
      const now = new Date()
      if (dateFilter === 'TODAY') {
        if (scanDate.toDateString() !== now.toDateString()) return false
      } else if (dateFilter === 'WEEK') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (scanDate < sevenDaysAgo) return false
      }
    }

    return true
  })

  // Distinct commodity names for filter dropdown
  const commodities = Array.from(
    new Set(locations.map((l) => l.products?.display_name || 'Unknown').filter(Boolean))
  )

  // Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const L = window.L
      // Center over Philippines
      const map = L.map(mapContainerRef.current, {
        center: [12.8797, 121.7740],
        zoom: 6,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded])

  // Update Markers on Map
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return
    const L = window.L
    const map = mapInstanceRef.current

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove())
    markersRef.current = {}

    if (filteredLocations.length === 0) return

    const bounds = L.latLngBounds()

    filteredLocations.forEach((item) => {
      const lat = parseFloat(item.latitude)
      const lng = parseFloat(item.longitude)
      if (isNaN(lat) || isNaN(lng)) return

      bounds.extend([lat, lng])

      const prodName = item.products?.display_name || 'Commodity Scan'
      const price = item.price_shown ? `₱${parseFloat(item.price_shown).toFixed(2)}` : 'N/A'
      const conf = item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : 'N/A'
      const timeStr = item.scanned_at ? new Date(item.scanned_at).toLocaleString() : '—'

      // Custom marker icon HTML
      const isRecent = item.scanned_at && (new Date() - new Date(item.scanned_at)) < 15 * 60 * 1000
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position:relative; display:flex; align-items:center; justify-content:center;">
            ${isRecent ? '<div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(34,197,94,0.4); animation:ping 1.5s infinite;"></div>' : ''}
            <div style="width:28px; height:28px; border-radius:50%; background:${isRecent ? '#16a34a' : '#052e16'}; border:2px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)

      const popupContent = `
        <div style="font-family:sans-serif; padding:4px 2px; min-width:180px;">
          <div style="font-weight:700; font-size:14px; color:#111827; margin-bottom:4px;">${prodName}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:13px; font-weight:800; color:#16a34a;">${price}</span>
            <span style="font-size:11px; font-weight:700; background:#dcfce7; color:#166534; padding:2px 6px; border-radius:8px;">${conf} match</span>
          </div>
          <div style="font-size:11px; color:#6b7280; margin-bottom:2px;">📍 Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
          <div style="font-size:11px; color:#9ca3af;">🕒 ${timeStr}</div>
        </div>
      `

      marker.bindPopup(popupContent)
      marker.on('click', () => setSelectedScan(item))
      markersRef.current[item.id] = marker
    })

    // Auto-fit map to markers if bounds are valid
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    }
  }, [leafletLoaded, filteredLocations])

  // Center map on scan item when clicked in side panel
  const flyToScan = (item) => {
    setSelectedScan(item)
    if (!mapInstanceRef.current || !item.latitude || !item.longitude) return
    const lat = parseFloat(item.latitude)
    const lng = parseFloat(item.longitude)
    mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 })
    if (markersRef.current[item.id]) {
      markersRef.current[item.id].openPopup()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-container { width: 100%; height: 100%; border-radius: 14px; z-index: 1; }
      `}</style>

      {/* Header bar with Stats & Controls */}
      <div style={{
        background: C.white,
        borderRadius: 14,
        padding: '16px 20px',
        border: `1px solid ${C.k100}`,
        boxShadow: '0 1px 4px rgba(0,0,0,.04)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* Title & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: C.g50, color: C.g600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${C.g100}`,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.k900, margin: 0 }}>
                Real-Time Location Monitoring
              </h2>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: C.g50, color: C.g700, border: `1px solid ${C.g100}`,
                borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.g500, animation: 'ping 1.8s infinite' }}></span>
                Live 5s Feed
              </span>
            </div>
            <p style={{ fontSize: 12, color: C.k500, margin: '2px 0 0' }}>
              Tracking geotagged market scanner activity in real-time
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Commodity Dropdown */}
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 10,
              border: `1px solid ${C.k200}`, background: C.white,
              fontSize: 13, fontWeight: 600, color: C.k700, cursor: 'pointer',
            }}
          >
            <option value="ALL">All Commodities ({commodities.length})</option>
            {commodities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Date Filter Dropdown */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 10,
              border: `1px solid ${C.k200}`, background: C.white,
              fontSize: 13, fontWeight: 600, color: C.k700, cursor: 'pointer',
            }}
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today Only</option>
            <option value="WEEK">Past 7 Days</option>
          </select>

          {/* Manual Refresh Button */}
          <button
            onClick={fetchLocations}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `1px solid ${C.k200}`, background: C.white,
              fontSize: 13, fontWeight: 600, color: C.k700, cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Main Map & Side Feed Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, minHeight: 520 }}>
        {/* Map Container */}
        <div style={{
          background: C.white,
          borderRadius: 14,
          border: `1px solid ${C.k100}`,
          boxShadow: '0 1px 4px rgba(0,0,0,.04)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 520,
        }}>
          {!leafletLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.k50 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.k500 }}>Loading Map Engine...</p>
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: 520 }} />
        </div>

        {/* Real-time Scan Feed Panel */}
        <div style={{
          background: C.white,
          borderRadius: 14,
          border: `1px solid ${C.k100}`,
          boxShadow: '0 1px 4px rgba(0,0,0,.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: 560,
        }}>
          {/* Feed Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${C.k100}`,
            background: C.k50,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: C.k900, margin: 0, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Geotagged Activity ({filteredLocations.length})
            </h3>
            {lastRefreshed && (
              <span style={{ fontSize: 11, color: C.k400 }}>
                Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          {/* Feed List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredLocations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: C.k400 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No geotagged scans yet</p>
                <p style={{ fontSize: 11, margin: '4px 0 0' }}>Scans captured via mobile camera with location permissions will appear here in real-time.</p>
              </div>
            ) : (
              filteredLocations.map((item) => {
                const isSelected = selectedScan?.id === item.id
                const prodName = item.products?.display_name || 'Commodity Scan'
                const priceStr = item.price_shown ? `₱${parseFloat(item.price_shown).toFixed(2)}` : 'N/A'
                const timeStr = item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

                return (
                  <div
                    key={item.id}
                    onClick={() => flyToScan(item)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: isSelected ? `2px solid ${C.g600}` : `1px solid ${C.k200}`,
                      background: isSelected ? C.g50 : C.white,
                      cursor: 'pointer',
                      transition: 'all .15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.k900, margin: 0 }}>{prodName}</p>
                      <p style={{ fontSize: 11, color: C.k500, margin: '2px 0 0' }}>
                        📍 {parseFloat(item.latitude).toFixed(4)}, {parseFloat(item.longitude).toFixed(4)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: C.g700, margin: 0 }}>{priceStr}</p>
                      <p style={{ fontSize: 10, color: C.k400, margin: '2px 0 0' }}>{timeStr}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
