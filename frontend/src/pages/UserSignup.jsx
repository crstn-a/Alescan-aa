// frontend/src/pages/UserSignup.jsx
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

export default function UserSignup() {
  const navigate = useNavigate()
  const { register, loading, error } = useUserAuth()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [localError, setLocalError] = useState(null)

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLocalError(null)

    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    const ok = await register({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      password: form.password,
      phone: form.phone || null,
    })
    if (ok) navigate('/report')
  }

  const displayError = localError || error

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
        .signup-input {
          width:100%; height:48px; padding:0 16px;
          border:1.5px solid ${C.border}; border-radius:12px;
          background:${C.surface}; color:${C.text}; font-size:15px;
          outline:none; transition:border-color .15s, box-shadow .15s;
        }
        .signup-input:focus {
          border-color:${C.g800};
          box-shadow:0 0 0 3px rgba(20,83,45,0.12);
        }
        .signup-input::placeholder { color:${C.textMuted}; }
        .signup-btn {
          width:100%; padding:14px; border-radius:12px; border:none;
          background:${C.g800}; color:#fff; font-size:16px; font-weight:700;
          font-family:inherit; cursor:pointer; transition:all .15s; letter-spacing:.02em;
        }
        .signup-btn:hover:not(:disabled) {
          background:${C.g700};
          transform:translateY(-1px);
          box-shadow:0 6px 20px rgba(22,101,52,.35);
        }
        .signup-btn:disabled { opacity:.6; cursor:not-allowed; }
        .auth-link { color:${C.primaryDark}; text-decoration:none; font-weight:600; transition:color .15s; }
        .auth-link:hover { color:${C.g800}; }
        .back-link {
          font-size:14px; color:${C.textSecondary}; text-decoration:none;
          display:inline-flex; align-items:center; gap:6px; transition:color .15s;
        }
        .back-link:hover { color:${C.g800}; }
        @media (max-width: 900px) {
          .signup-left-panel { display: none !important; }
          .signup-right-panel { flex: 1 1 auto !important; }
        }
      `}</style>

      {/* ── LEFT PANEL — branding ── */}
      <div className="signup-left-panel" style={{
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
              Create an account to report vendors selling above the suggested retail price. Help keep market prices fair for everyone.
            </p>
          </div>
          <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.48)', letterSpacing:'.06em', textTransform:'uppercase' }}>
            Olongapo City Public Market Place
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — signup form ── */}
      <div className="signup-right-panel" style={{
        flex: '0 0 520px',
        background: C.surface,
        borderLeft: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: 'clamp(24px,4vw,48px) clamp(24px,4vw,48px)',
      }}>
        <div style={{ maxWidth:420, margin:'0 auto', width:'100%', animation:'fadeUp .3s ease' }}>

          <div style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:28, fontWeight:800, color:C.text, marginBottom:8, letterSpacing:'-.01em' }}>
              Create Account
            </h2>
            <p style={{ fontSize:15, color:C.textSecondary, margin:0 }}>
              Sign up to start reporting overpriced vendors
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* First & Last Name — side by side */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:6 }}>First Name</label>
                <input className="signup-input" type="text" value={form.first_name} onChange={update('first_name')} placeholder="Juan" required />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:6 }}>Last Name</label>
                <input className="signup-input" type="text" value={form.last_name} onChange={update('last_name')} placeholder="Dela Cruz" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:6 }}>Email</label>
              <input className="signup-input" type="email" value={form.email} onChange={update('email')} placeholder="juan@example.com" required />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:6 }}>
                Phone No. <span style={{ color:C.textMuted, fontWeight:400 }}>(optional)</span>
              </label>
              <input className="signup-input" type="tel" value={form.phone} onChange={update('phone')} placeholder="09XX XXX XXXX" />
            </div>

            {/* Password & Confirm — side by side */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:6 }}>Password</label>
                <input className="signup-input" type="password" value={form.password} onChange={update('password')} placeholder="••••••••" required autoComplete="new-password" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.text, marginBottom:6 }}>Confirm Password</label>
                <input className="signup-input" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="••••••••" required autoComplete="new-password" />
              </div>
            </div>

            {/* Error */}
            {displayError && (
              <div style={{ padding:'12px 16px', borderRadius:12, background:C.errorBg, border:`1px solid ${C.errorBorder}`, display:'flex', alignItems:'center', gap:10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p style={{ fontSize:14, color:C.errorDark, margin:0, fontWeight:600 }}>{displayError}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="signup-btn" disabled={loading || !form.first_name || !form.last_name || !form.email || !form.password || !form.confirmPassword} style={{ marginTop:4 }}>
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ width:18, height:18, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />
                  Creating account...
                </span>
              ) : 'Sign Up'}
            </button>
          </form>

          {/* Links */}
          <div style={{ marginTop:24, textAlign:'center' }}>
            <p style={{ fontSize:14, color:C.textSecondary, margin:'0 0 16px' }}>
              Already have an account?{' '}
              <Link to="/user/login" className="auth-link">Sign In</Link>
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
