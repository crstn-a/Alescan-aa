// frontend/src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom'

// ── Colour Palette ─────────────────────────────────────────────────────
const C = {
  primary:   '#22c55e',
  primaryDark:'#16a34a',
  primaryLight:'#f0fdf4',
  bg:        '#f9fafb',
  surface:   '#ffffff',
  border:    '#f3f4f6',
  text:      '#111827',
  textSecondary:'#6b7280',
  textMuted: '#9ca3af',
}

// ── Icon Components ────────────────────────────────────────────────────
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const Icons = {
  camera:    "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  checkCircle: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3",
  database:  "M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3 M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6 M4 12c0 1.657 3.582 3 8 3s8-1.343 8-3",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap:       "M13 2L3 14h8l-2 8 10-12h-8l2-8z",
  menu:      "M3 12h18 M3 6h18 M3 18h18",
  close:     "M18 6L6 18 M6 6l12 12",
  chevronRight: "M9 18l6-6-6-6",
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; cursor: pointer; }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.12); }
      `}</style>

      {/* ── Navigation Bar ───────────────────────────────────────────── */}
      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
            }}>
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>A</span>
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Alescan</p>
              <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>SRP Verification</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#home" style={{ fontSize: 14, fontWeight: 500, color: C.text, textDecoration: 'none' }}>Home</a>
            <a href="#how-it-works" style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary, textDecoration: 'none' }}>How It Works</a>
            <a href="#about" style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary, textDecoration: 'none' }}>About</a>
            <button
              onClick={() => navigate('/scanner')}
              style={{
                background: C.primary,
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                boxShadow: '0 2px 8px rgba(34,197,94,0.25)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.primaryDark}
              onMouseLeave={e => e.currentTarget.style.background = C.primary}
            >
              Use Scanner
            </button>
          </nav>

          {/* Mobile menu (simplified) */}
          <div style={{ display: 'none' }}> {/* Mobile menu omitted for brevity, can be added later */}
            <button style={{ background: 'none', border: 'none', color: C.text }}>
              <Icon d={Icons.menu} size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: C.primaryLight,
              borderRadius: 40,
              padding: '4px 12px',
              width: 'fit-content',
              border: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.primaryDark }}>Bantay Presyo • Department of Agriculture</span>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(36px, 8vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.2,
              color: C.text,
              margin: 0,
            }}>
              Verify SRP Prices<br />
              <span style={{ color: C.primary }}>Instantly with Your Camera</span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 18,
              color: C.textSecondary,
              lineHeight: 1.6,
              margin: '16px 0 8px',
            }}>
              A Vision-Based Centralized SRP Verification Scanner for Public Markets<br />
              Using Computer Vision and Automated Price Synchronization from the<br />
              Department of Agriculture Bantay Presyo.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <button
                onClick={() => navigate('/scanner')}
                style={{
                  background: C.primary,
                  border: 'none',
                  borderRadius: 12,
                  padding: '16px 32px',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                className="hover-lift"
                onMouseEnter={e => e.currentTarget.style.background = C.primaryDark}
                onMouseLeave={e => e.currentTarget.style.background = C.primary}
              >
                <Icon d={Icons.camera} size={20} />
                Start Scanning
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '16px 32px',
                  fontSize: 16,
                  fontWeight: 500,
                  color: C.text,
                  transition: 'all 0.15s',
                }}
                className="hover-lift"
              >
                Learn More
              </button>
            </div>

            {/* Stats / Feature Highlights */}
            <div style={{ display: 'flex', gap: 40, marginTop: 48 }}>
              <div>
                <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Updated Weekly</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>DA Bantay Presyo</p>
              </div>
              <div>
                <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 4 }}>Powered by</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>YOLOv11 Vision AI</p>
              </div>
              <div>
                <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 4 }}>No Installation</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Works in Browser</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ──────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '60px 24px', background: C.surface }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 12 }}>How It Works</h2>
            <p style={{ fontSize: 18, color: C.textSecondary }}>Simple, fast, and accessible to everyone.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 32,
          }}>
            {[
              { icon: Icons.camera, title: '1. Open Scanner', desc: 'Access the scanner directly from your phone or tablet browser. No app installation required.' },
              { icon: Icons.shield, title: '2. Point Camera', desc: 'Hold your camera over the commodity. Our AI identifies the item in real-time.' },
              { icon: Icons.checkCircle, title: '3. Verify Price', desc: 'Instantly see the official SRP from the latest DA Bantay Presyo data.' },
              { icon: Icons.database, title: '4. Stay Informed', desc: 'All scans are logged to help track market price compliance.' },
            ].map((step, i) => (
              <div key={i} style={{
                background: C.bg,
                borderRadius: 20,
                padding: 32,
                border: `1px solid ${C.border}`,
                transition: 'all 0.15s',
              }} className="hover-lift">
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: C.primaryLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.primary,
                  marginBottom: 20,
                }}>
                  <Icon d={step.icon} size={28} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem Statement Section ─────────────────────────────────── */}
      <section id="about" style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center' }}>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{
                display: 'inline-block',
                background: C.primaryLight,
                borderRadius: 40,
                padding: '4px 16px',
                marginBottom: 20,
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.primaryDark }}>The Challenge</span>
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 20 }}>Making Price Data Accessible to Everyone</h2>
              <p style={{ fontSize: 16, color: C.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                Currently, Bantay Presyo publishes price data as scanned images converted into PDF documents containing long lists of commodities and their weekly prices.
              </p>
              <p style={{ fontSize: 16, color: C.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                Many consumers cannot easily read or navigate these documents because:
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['The text is small and difficult to read', 'The document is lengthy and hard to search', 'Many vendors are not digitally familiar', 'Some vendors are elderly or visually impaired'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, fontSize: 16, color: C.text }}>
                    <div style={{ color: C.primary, flexShrink: 0 }}><Icon d={Icons.checkCircle} size={18} /></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ flex: '1 1 400px', background: C.surface, borderRadius: 24, padding: 32, border: `1px solid ${C.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
                  <Icon d={Icons.zap} size={24} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Our Solution</h3>
              </div>
              <p style={{ fontSize: 16, color: C.textSecondary, lineHeight: 1.7, marginBottom: 20 }}>
                The proposed system converts these static PDF price reports into an interactive, mobile-friendly verification system accessible from any smartphone or tablet browser — <strong>no installation required</strong>.
              </p>
              <div style={{ background: C.primaryLight, borderRadius: 16, padding: 20, marginTop: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.primaryDark, marginBottom: 12 }}>Core System Flow</p>
                <ol style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 8, color: C.text }}>Open the PWA on any browser-enabled device</li>
                  <li style={{ marginBottom: 8, color: C.text }}>Camera captures image of the commodity</li>
                  <li style={{ marginBottom: 8, color: C.text }}>YOLOv11 inference identifies the item</li>
                  <li style={{ marginBottom: 8, color: C.text }}>Latest official price retrieved from database</li>
                  <li style={{ marginBottom: 8, color: C.text }}>Price displayed clearly on screen</li>
                  <li style={{ color: C.text }}>Scan event logged for analytics</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '32px 24px', background: C.surface }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>A</span>
            </div>
            <span style={{ fontSize: 14, color: C.textSecondary }}>© 2026 Alescan.</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ fontSize: 14, color: C.textSecondary, textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ fontSize: 14, color: C.textSecondary, textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ fontSize: 14, color: C.textSecondary, textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}