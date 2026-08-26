// frontend/src/pages/UserLogin.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useUserAuth } from '../hooks/useUserAuth'

const C = {
  primary:      '#22c55e',
  primaryDark:  '#16a34a',
  g900:         '#052e16',
  g800:         '#14532d',
  g700:         '#166534',
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

export default function UserLogin() {
  const navigate = useNavigate()
  const { login, loading, error } = useUserAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/report')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      overflow: 'hidden',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        html,body { margin:0; padding:0; }
        * { box-sizing:border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        input { font-family:inherit; }
        .login-input {
          width:100%; height:48px; padding:0 16px;
          border:1.5px solid ${C.border}; border-radius:12px;
          background:${C.surface}; color:${C.text}; font-size:15px;
          outline:none; transition:border-color .15s, box-shadow .15s;
        }
        .login-input:focus {
          border-color:${C.g800};
          box-shadow:0 0 0 3px rgba(20,83,45,0.12);
        }
        .login-input::placeholder { color:${C.textMuted}; }
        .login-btn {
          width:100%; padding:14px; border-radius:12px; border:none;
          background:${C.g800}; color:#fff; font-size:16px; font-weight:700;
          font-family:inherit; cursor:pointer; transition:all .15s; letter-spacing:.02em;
        }
        .login-btn:hover:not(:disabled) {
          background:${C.g700};
          transform:translateY(-1px);
          box-shadow:0 6px 20px rgba(22,101,52,.35);
        }
        .login-btn:disabled { opacity:.6; cursor:not-allowed; }
        .pw-toggle {
          position:absolute; right:14px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:${C.textMuted};
          padding:4px; display:flex; align-items:center; transition:color .15s;
        }
        .pw-toggle:hover { color:${C.text}; }
        .auth-link { color:${C.primaryDark}; text-decoration:none; font-weight:600; transition:color .15s; }
        .auth-link:hover { color:${C.g800}; }
        .back-link {
          font-size:14px; color:${C.textSecondary}; text-decoration:none;
          display:inline-flex; align-items:center; gap:6px; transition:color .15s;
        }
        .back-link:hover { color:${C.g800}; }
        @media (max-width: 900px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { flex: 1 1 auto !important; }
        }
      `}</style>

      {/* ── LEFT PANEL — branding ── */}
      <div className="login-left-panel" style={{
        flex: '1 1 0',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(32px,5vw,56px) clamp(28px,5vw,52px)',
      }}>
        <img
          src="/BG-Image-LoginPage.png"
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            pointerEvents: 'none',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg,rgba(5,46,22,.84) 0%,rgba(20,83,45,.75) 55%,rgba(22,101,52,.68) 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', height:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <img src="/Alescan-Logo.png" alt="Alescan" style={{ width:52, height:52, objectFit:'contain', filter:'brightness(0) invert(1)' }} />
            <span style={{ fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'.04em' }}>ALESCAN</span>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <h1 style={{ fontSize:'clamp(36px,3.2vw,52px)', fontWeight:800, color:'#fff', lineHeight:1.2, margin:'0 0 20px', maxWidth:800 }}>
              Report Overpriced Vendors
            </h1>
            <p style={{ fontSize:'clamp(16px,1.4vw,18px)', color:'rgba(255,255,255,.70)', lineHeight:1.75, maxWidth:460, margin:0 }}>
              Sign in to your account to submit and track your vendor price reports. Help keep market prices fair.
            </p>
          </div>
          <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.48)', letterSpacing:'.06em', textTransform:'uppercase' }}>
            Olongapo City Public Market Place
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — login form ── */}
      <div className="login-right-panel" style={{
        flex: '0 0 460px',
        background: C.surface,
        borderLeft: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: 'clamp(32px,6vw,64px) clamp(28px,5vw,52px)',
      }}>
        <div style={{ maxWidth:380, margin:'0 auto', width:'100%', animation:'fadeUp .3s ease' }}>

          <div style={{ marginBottom:36 }}>
            <h2 style={{ fontSize:30, fontWeight:800, color:C.text, marginBottom:8, letterSpacing:'-.01em' }}>
              Sign In
            </h2>
            <p style={{ fontSize:15, color:C.textSecondary, margin:0 }}>
              Enter your email and password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Email */}
            <div>
              <label style={{ display:'block', fontSize:14, fontWeight:600, color:C.text, marginBottom:8 }}>Email</label>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="juan@example.com"
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display:'block', fontSize:14, fontWeight:600, color:C.text, marginBottom:8 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  className="login-input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight:48 }}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPass(p => !p)}>
                  <Icon d={showPass ? Icons.eyeOff : Icons.eye} size={18} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding:'12px 16px', borderRadius:12, background:C.errorBg, border:`1px solid ${C.errorBorder}`, display:'flex', alignItems:'center', gap:10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p style={{ fontSize:14, color:C.errorDark, margin:0, fontWeight:600 }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="login-btn" disabled={loading || !email || !password} style={{ marginTop:8 }}>
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ width:18, height:18, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Links */}
          <div style={{ marginTop:28, textAlign:'center' }}>
            <p style={{ fontSize:14, color:C.textSecondary, margin:'0 0 16px' }}>
              Don't have an account?{' '}
              <Link to="/user/signup" className="auth-link">Sign Up</Link>
            </p>
            <a href="/" className="back-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to Alescan home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
