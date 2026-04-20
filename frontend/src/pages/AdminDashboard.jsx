import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'
import {
  getScanLogs, getSyncLogs, getErrorLogs,
  getPriceRecords, triggerSync,
} from '../api/adminApi'

const TABS = ['Scan logs', 'Price records', 'Sync logs', 'Error logs']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { authed, logout } = useAdminAuth()

  const [tab, setTab] = useState(0)
  const [data, setData] = useState([])
  const [stats, setStats] = useState({ scans: 0, prices: 0, lastSync: null })
  const [fetching, setFetching] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState(null)

  if (!authed) return <Navigate to="/admin/login" replace />

  const loadTab = useCallback(async (t) => {
    setFetching(true)
    setData([])
    try {
      let rows = []
      if (t === 0) rows = await getScanLogs()
      if (t === 1) rows = await getPriceRecords()
      if (t === 2) rows = await getSyncLogs()
      if (t === 3) rows = await getErrorLogs()
      setData(rows)
    } catch (e) {
      if (e.message === 'forbidden') {
        logout()
        navigate('/admin/login')
      }
    } finally {
      setFetching(false)
    }
  }, [logout, navigate])

  useEffect(() => {
    async function loadStats() {
      try {
        const [scans, syncs, prices] = await Promise.all([
          getScanLogs(100),
          getSyncLogs(1),
          getPriceRecords(),
        ])
        setStats({
          scans: scans.length,
          prices: prices.length,
          lastSync: syncs[0] || null,
        })
      } catch {}
    }
    loadStats()
  }, [])

  useEffect(() => { loadTab(tab) }, [tab, loadTab])

  async function handleSync() {
    setSyncing(true)
    setToast(null)
    try {
      const res = await triggerSync()
      setToast({
        type: res.result?.status === 'success' ? 'ok' : 'warn',
        text: res.result?.status === 'success'
          ? `Sync complete — ${res.result.count} prices via ${res.result.extractor}`
          : `Sync issue: ${res.result?.error || 'unknown'}`,
      })
      if (tab === 2) loadTab(2)
    } catch {
      setToast({ type: 'err', text: 'Sync request failed — is the backend running?' })
    } finally {
      setSyncing(false)
      setTimeout(() => setToast(null), 6000)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-background-tertiary)'
    }}>

      {/* Header */}
      <header style={{
        background: 'var(--color-background-primary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            background: '#1D9E75',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#fff', fontSize: 13 }}>A</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Alescan Admin</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync now'}
          </button>

          <button onClick={() => {
            logout()
            navigate('/admin/login')
          }}>
            Sign out
          </button>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div style={{
          padding: 10,
          background:
            toast.type === 'ok' ? '#d1fae5' :
            toast.type === 'warn' ? '#fef3c7' :
            '#fee2e2'
        }}>
          {toast.text}
        </div>
      )}

      <main style={{ padding: 20 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        {fetching
          ? <p>Loading...</p>
          : <DataTable tab={tab} rows={data} />
        }

      </main>
    </div>
  )
}

/* Table */

function DataTable({ tab, rows }) {
  if (!rows.length) return <p>No records yet.</p>

  if (tab === 1) {
    return (
      <table>
        <thead>
          <tr>
            <th>Commodity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.product}</td>
              <td>₱{Number(r.official_srp).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return <pre>{JSON.stringify(rows, null, 2)}</pre>
}