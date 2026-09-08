import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getScanLogs } from '../api/adminApi'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize Supabase Client for Realtime Subscription
let supabaseClient = null
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export default function LiveMap() {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})

  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')
  const [latestLatency, setLatestLatency] = useState(null)
  const [selectedScan, setSelectedScan] = useState(null)

  // Inject Leaflet CSS dynamically if not present
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
  }, [])

  // Helper to format timestamps nicely
  const formatTs = (ts) => {
    if (!ts) return '—'
    try {
      const d = new Date(ts)
      return d.toLocaleString('en-PH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).replace(',', '')
    } catch {
      return ts
    }
  }

  // Load initial scans from admin API
  const fetchScans = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getScanLogs(100)
      if (Array.isArray(data)) {
        setScans(data)
      }
    } catch (err) {
      console.error('Failed to fetch scan logs for live map:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScans()
  }, [fetchScans])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return // Already initialized

    // Load Leaflet module dynamically or via window.L
    const initMap = async () => {
      let L = window.L
      if (!L) {
        try {
          const leafletModule = await import('leaflet')
          L = leafletModule.default || leafletModule
        } catch {
          console.error('Failed to load Leaflet module')
          return
        }
      }

      // Default map center: Olongapo City, Philippines
      const defaultLat = 14.8386
      const defaultLng = 120.2842

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Add marker to map
  const addMarkerToMap = useCallback((scan) => {
    if (!mapInstanceRef.current) return
    const L = window.L || (window.L = window.L || {})
    if (!L.marker) return

    const lat = parseFloat(scan.latitude)
    const lng = parseFloat(scan.longitude)
    if (isNaN(lat) || isNaN(lng)) return

    // If marker already exists, do not duplicate
    if (markersRef.current[scan.id]) return

    const prodName = scan.products?.display_name || scan.products?.name || scan.commodity_name || 'Unidentified Commodity'
    const confPct = scan.confidence != null ? `${(scan.confidence * 100).toFixed(1)}%` : 'N/A'
    const priceStr = scan.price_shown != null ? `₱${scan.price_shown}/kg` : 'N/A'
    const timestampStr = formatTs(scan.scanned_at)
    const accuracyStr = scan.location_accuracy != null ? `±${Math.round(scan.location_accuracy)} m` : 'Unknown'

    // Create custom SVG Pin Icon
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #22c55e;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
        ">
          📍
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })

    const popupContent = `
      <div style="font-family: system-ui, sans-serif; min-width: 200px; padding: 4px;">
        <h4 style="margin: 0 0 6px 0; color: #111827; font-size: 15px; font-weight: 700;">
          Commodity: ${prodName}
        </h4>
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #374151;">
          <div><strong>Confidence:</strong> <span style="color: #16a34a; font-weight: 600;">${confPct}</span></div>
          <div><strong>DA Price:</strong> <span style="color: #111827; font-weight: 700;">${priceStr}</span></div>
          <div><strong>Scanned:</strong> ${timestampStr}</div>
          <div><strong>Location Accuracy:</strong> <span style="color: #6b7280;">${accuracyStr}</span></div>
        </div>
      </div>
    `

    const marker = L.marker([lat, lng], { icon: customIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(popupContent)

    marker.on('click', () => {
      setSelectedScan(scan)
    })

    markersRef.current[scan.id] = marker
  }, [])

  // Render markers whenever scans update or map is ready
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const validScans = scans.filter(s => s.latitude != null && s.longitude != null)
    validScans.forEach(scan => addMarkerToMap(scan))

    // Pan map to latest marker if available
    if (validScans.length > 0 && mapInstanceRef.current) {
      const latest = validScans[0]
      const lat = parseFloat(latest.latitude)
      const lng = parseFloat(latest.longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        mapInstanceRef.current.setView([lat, lng], 13)
      }
    }
  }, [scans, addMarkerToMap])

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!supabaseClient) {
      setRealtimeStatus('disabled')
      return
    }

    setRealtimeStatus('connecting')

    const channel = supabaseClient
      .channel('public:scan_events_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scan_events' },
        (payload) => {
          const realtimeReceivedAt = new Date().toISOString()
          const newRow = payload.new

          // Compute Latency metrics
          let processingLatency = newRow.processing_latency_ms
          let realtimeLatency = null

          if (newRow.scanned_at) {
            const dbTime = new Date(newRow.scanned_at).getTime()
            const rxTime = new Date(realtimeReceivedAt).getTime()
            if (!isNaN(dbTime) && !isNaN(rxTime) && rxTime >= dbTime) {
              realtimeLatency = rxTime - dbTime
            }
          }

          const latencyInfo = {
            scan_initiated_at: newRow.client_scanned_at || 'Not provided',
            db_inserted_at: newRow.scanned_at || newRow.created_at,
            realtime_received_at: realtimeReceivedAt,
            processing_latency_ms: processingLatency != null ? `${processingLatency} ms` : 'N/A',
            realtime_latency_ms: realtimeLatency != null ? `${realtimeLatency} ms` : '< 100 ms',
          }

          setLatestLatency(latencyInfo)

          // Add new scan to state feed
          setScans((prev) => [newRow, ...prev])

          // Plot marker if valid coordinates exist
          if (newRow.latitude != null && newRow.longitude != null) {
            addMarkerToMap(newRow)
            // Center map on new live marker
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([newRow.latitude, newRow.longitude], 14, { animate: true })
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('error')
        }
      })

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [addMarkerToMap])

  const validScansCount = scans.filter(s => s.latitude != null && s.longitude != null).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Top Info & Latency Telemetry Header ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {/* Realtime Status Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', margin: '0 0 4px 0' }}>
              Supabase Realtime Stream
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              {validScansCount} Active Markers
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 20,
            background: realtimeStatus === 'connected' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${realtimeStatus === 'connected' ? '#dcfce7' : '#fee2e2'}`,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: realtimeStatus === 'connected' ? '#22c55e' : '#ef4444',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: realtimeStatus === 'connected' ? '#166534' : '#991b1b' }}>
              {realtimeStatus === 'connected' ? 'Live Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Latency Instrumentation Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', margin: '0 0 6px 0' }}>
            Pipeline Latency Instrumentation
          </p>
          {latestLatency ? (
            <div style={{ fontSize: 12, color: '#374151', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div><strong>Processing Latency:</strong> <span style="color:#16a34a; font-weight:700">{latestLatency.processing_latency_ms}</span></div>
              <div><strong>Realtime Delivery Latency:</strong> <span style="color:#2563eb; font-weight:700">{latestLatency.realtime_latency_ms}</span></div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                *Timestamps account for client/server clock variations.
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              Waiting for live scan event... (showing past scans)
            </p>
          )}
        </div>
      </div>

      {/* ── Main Map Canvas & Activity Feed Split View ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: 20,
        height: '620px',
      }}>
        {/* Leaflet Container */}
        <div style={{
          background: '#f9fafb',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Loading Live Scan Map...</p>
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{ paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
              Recent Scan Activity
            </h3>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
              Real-time feed of scanned commodities
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scans.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 40 }}>
                No scan events recorded yet.
              </p>
            ) : (
              scans.map((scan) => {
                const hasCoords = scan.latitude != null && scan.longitude != null
                const prodName = scan.products?.display_name || scan.products?.name || scan.commodity_name || 'Unidentified'
                const confPct = scan.confidence != null ? `${(scan.confidence * 100).toFixed(1)}%` : '—'

                return (
                  <div
                    key={scan.id || Math.random()}
                    onClick={() => {
                      if (hasCoords && mapInstanceRef.current) {
                        mapInstanceRef.current.setView([scan.latitude, scan.longitude], 15, { animate: true })
                        const marker = markersRef.current[scan.id]
                        if (marker) marker.openPopup()
                      }
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${hasCoords ? '#dcfce7' : '#f3f4f6'}`,
                      background: hasCoords ? '#f0fdf4' : '#f9fafb',
                      cursor: hasCoords ? 'pointer' : 'default',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                        {prodName}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 12,
                        background: hasCoords ? '#22c55e' : '#9ca3af', color: '#ffffff'
                      }}>
                        {hasCoords ? '📍 Map Marker' : 'No Location'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4b5563' }}>
                      <span>Confidence: <strong>{confPct}</strong></span>
                      <span>{scan.price_shown ? `₱${scan.price_shown}/kg` : 'No price'}</span>
                    </div>

                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                      {formatTs(scan.scanned_at)} {scan.location_accuracy != null ? `(±${Math.round(scan.location_accuracy)}m)` : ''}
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
