// frontend/src/pages/AdminLogin.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, loading, error } = useAdminAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await login(username, password)
    if (ok) navigate('/admin')
  }

  const inputStyle = {
    width: '100%', height: 40, padding: '0 12px',
    border: '0.5px solid var(--color-border-secondary)',
    borderRadius: 'var(--border-radius-md)',
    background: 'var(--color-background-secondary)',
    color: 'var(--color-text-primary)', fontSize: 14,
    outline: 'none', fontFamily: 'var(--font-sans)',
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--color-background-tertiary)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 380, background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)', padding: '36px 32px',
        display: 'flex', flexDirection: 'column', gap: 28,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, background: '#1D9E75', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 600 }}>A</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px' }}>
              Admin sign in
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', margin: 0 }}>
              Alescan SRP Scanner — Palengke Admin
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)',
              display: 'block', marginBottom: 6,
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{
              fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)',
              display: 'block', marginBottom: 6,
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--border-radius-md)',
              background: 'var(--color-background-danger)',
              border: '0.5px solid var(--color-border-danger)',
            }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-danger)', margin: 0 }}>
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: '100%', padding: '11px', borderRadius: 'var(--border-radius-md)',
              border: 'none', background: loading ? '#0F6E56' : '#1D9E75',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              opacity: (!username || !password || loading) ? 0.65 : 1,
              transition: 'all .15s', marginTop: 4,
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

      </div>
    </div>
  )
}