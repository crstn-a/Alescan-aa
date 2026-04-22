// frontend/src/pages/AdminLogin.jsx (light version with full‑screen background)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

const C = {
  primary:   '#22c55e',
  primaryDark:'#16a34a',
  primaryLight:'#f0fdf4',
  bg:        '#f9fafb',
  surface:   '#ffffff',
  card:      '#ffffff',
  border:    '#f3f4f6',
  text:      '#111827',
  textSecondary:'#6b7280',
  textMuted: '#9ca3af',
  error:     '#ef4444',
}

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const Icons = {
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M1 1l22 22",
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, loading, error } = useAdminAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await login(username, password)
    if (ok) navigate('/admin')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      margin: 0,
      padding: 0,
      background: C.bg,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        html, body { margin: 0; padding: 0; background: ${C.bg}; }
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input { font-family: inherit; }
        .login-input {
          width: 100%; height: 48px; padding: 0 16px;
          border: 1.5px solid ${C.border}; border-radius: 12px;
          background: ${C.surface}; color: ${C.text}; font-size: 15px;
          outline: none; transition: border-color .15s, box-shadow .15s;
        }
        .login-input:focus { border-color: ${C.primary}; box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }
        .login-input::placeholder { color: ${C.textMuted}; }
        .login-btn {
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          background: ${C.primary}; color: #fff; font-size: 16px; font-weight: 600;
          font-family: inherit; cursor: pointer; transition: all .15s;
          box-shadow: 0 4px 12px rgba(34,197,94,0.25);
        }
        .login-btn:hover:not(:disabled) { background: ${C.primaryDark}; box-shadow: 0 6px 16px rgba(34,197,94,0.35); transform: translateY(-1px); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .password-toggle {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: ${C.textMuted};
          padding: 4px; display: flex; align-items: center; justify-content: center;
          transition: color .15s;
        }
        .password-toggle:hover { color: ${C.text}; }
      `}</style>

      {/* Two‑column layout – full width & height */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
      }}>
        {/* Left panel – full height, gradient background */}
        <div style={{
          flex: '1 1 480px',
          background: `linear-gradient(145deg, ${C.primaryLight} 0%, ${C.surface} 100%)`,
          padding: 'clamp(32px, 6vw, 64px) clamp(24px, 5vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(34,197,94,0.06)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: C.primaryLight, border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: C.primary, fontSize: 22, fontWeight: 800 }}>A</span>
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Alescan</p>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Admin Portal</p>
              </div>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 44px)',
              fontWeight: 800,
              color: C.text,
              lineHeight: 1.2,
              marginBottom: 20,
              maxWidth: 600,
            }}>
              Manage SRP Verification & Market Monitoring
            </h1>

            <p style={{
              fontSize: 18,
              color: C.textSecondary,
              lineHeight: 1.6,
              maxWidth: 540,
            }}>
              Access the central dashboard to monitor scan activity, synchronize commodity prices, and review system logs.
            </p>
          </div>

          <p style={{
            position: 'relative',
            zIndex: 2,
            marginTop: 48,
            fontSize: 13,
            color: C.textMuted,
          }}>
            Department of Agriculture • Bantay Presyo Program
          </p>
        </div>

        {/* Right panel – full height, consistent background */}
        <div style={{
          flex: '0 0 520px',
          background: C.bg,
          padding: 'clamp(32px, 6vw, 64px) clamp(24px, 5vw, 48px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderLeft: `1px solid ${C.border}`,
        }}>
          <div style={{ maxWidth: 400, margin: '0 auto', width: '100%', animation: 'fadeUp .3s ease' }}>
            {/* Mobile logo */}
            <div className="mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
              }}>
                <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>A</span>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Alescan</p>
                <p style={{ fontSize: 12, color: C.textMuted }}>Admin Portal</p>
              </div>
            </div>
            <style>{`@media(max-width:900px){.mobile-logo{display:flex !important}}`}</style>

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 8 }}>Sign in</h2>
              <p style={{ fontSize: 15, color: C.textSecondary }}>Enter your credentials to access the dashboard</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Username</label>
                <input className="login-input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required autoFocus autoComplete="username" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="login-input" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" style={{ paddingRight: 48 }} />
                  <button type="button" className="password-toggle" onClick={() => setShowPass(p => !p)}>
                    <Icon d={showPass ? Icons.eyeOff : Icons.eye} size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ fontSize: 14, color: '#991b1b', margin: 0 }}>{error}</p>
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading || !username || !password} style={{ marginTop: 8 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <a href="/" style={{ fontSize: 14, color: C.textSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                 onMouseEnter={e => e.currentTarget.style.color = C.primary}
                 onMouseLeave={e => e.currentTarget.style.color = C.textSecondary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M19 12H5 M12 19l-7-7 7-7"/>
                </svg>
                Back to Alescan home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}