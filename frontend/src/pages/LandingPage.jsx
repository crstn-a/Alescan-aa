// frontend/src/pages/LandingPage.jsx
// ⚠️  Place Alescan-Logo.png in your /public folder

import { useNavigate } from 'react-router-dom'

const C = {
  primary:    '#22c55e',
  primaryDark:'#16a34a',
  g900:       '#052e16',
  g800:       '#14532d',
  primaryLight:'#f0fdf4',
  bg:         '#f9fafb',
  surface:    '#ffffff',
  border:     '#f3f4f6',
  text:       '#111827',
  textSecondary:'#6b7280',
  textMuted:  '#9ca3af',
}

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const Icons = {
  camera:      "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  checkCircle: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3",
  database:    "M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3 M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6 M4 12c0 1.657 3.582 3 8 3s8-1.343 8-3",
  shield:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap:         "M13 2L3 14h8l-2 8 10-12h-8l2-8z",
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
        *{box-sizing:border-box;margin:0;padding:0}
        button{font-family:inherit;cursor:pointer}
        .hover-lift{transition:all .15s}
        .hover-lift:hover{transform:translateY(-2px);box-shadow:0 12px 24px -8px rgba(0,0,0,.12)}
        .nav-link{transition:color .15s}
        .nav-link:hover{color:${C.primaryDark}!important}
        .use-scanner-btn:hover{background:${C.g800}!important}
        .start-scanning-btn:hover{background:${C.g800}!important}
        .step-card{transition:all .15s}
        .step-card:hover{transform:translateY(-2px);box-shadow:0 12px 24px -8px rgba(0,0,0,.1)}
      `}</style>

      {/* ── Navigation Bar ─────────────────────────────────────────── */}
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
            <img
              src="/Alescan-Logo.png"
              alt="Alescan"
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#home" className="nav-link" style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none' }}>Home</a>
            <a href="#how-it-works" className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary, textDecoration: 'none' }}>How it works</a>
            <a href="#about" className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary, textDecoration: 'none' }}>About</a>
            <button
              className="use-scanner-btn"
              onClick={() => navigate('/scanner')}
              style={{
                background: C.primaryDark,
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                transition: 'all 0.15s',
              }}
            >
              Use Scanner
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section id="home" style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: C.primaryLight, borderRadius: 40,
              padding: '4px 14px', width: 'fit-content',
              border: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.g800 }}>
                Bantay Presyo • Department of Agriculture
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(36px, 7vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: C.g900,
              margin: 0,
            }}>
              Verify SRP Prices<br />
              <span style={{ color: C.primaryDark }}>Instantly with your Camera</span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 17,
              color: C.textSecondary,
              lineHeight: 1.65,
              margin: '12px 0 4px',
              maxWidth: 620,
            }}>
              A Vision-Based Centralized SRP Verification Scanner for Public Markets
              Using Computer Vision and Automated Price Synchronization from the
              Department of Agriculture Bantay Presyo.
            </p>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
              <button
                className="start-scanning-btn"
                onClick={() => navigate('/scanner')}
                style={{
                  background: C.primaryDark,
                  border: 'none',
                  borderRadius: 12,
                  padding: '15px 30px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(22,101,52,.25)',
                }}
              >
                <Icon d={Icons.camera} size={18} />
                Start Scanning
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: C.surface,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '15px 30px',
                  fontSize: 15,
                  fontWeight: 500,
                  color: C.text,
                  transition: 'all 0.15s',
                }}
                className="hover-lift"
              >
                Learn More
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, marginTop: 48 }}>
              {[
                { top: 'Updated Weekly',    bot: 'DA Bantay Presyo' },
                { top: 'Powered by',        bot: 'YOLOv11 Vision AI' },
                { top: 'No Installation',   bot: 'Works with Browser' },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>{s.top}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: C.g900 }}>{s.bot}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '60px 24px', background: C.surface }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: C.g900, marginBottom: 10 }}>How it Works</h2>
            <p style={{ fontSize: 17, color: C.textSecondary }}>Simple, fast, and accessible to everyone.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 24 }}>
            {[
              { icon: Icons.camera,      title: '1. Open Scanner',  desc: 'Access the scanner directly from your phone or tablet browser. No app installation required.' },
              { icon: Icons.shield,      title: '2. Point Camera',  desc: 'Hold your camera over the commodity. Our AI identifies the item in real-time.' },
              { icon: Icons.checkCircle, title: '3. Verify Price',  desc: 'Instantly see the official SRP from the latest DA Bantay Presyo data.' },
              { icon: Icons.database,    title: '4. Stay Informed', desc: 'All scans are logged to help track market price compliance.' },
            ].map((step, i) => (
              <div key={i} className="step-card" style={{
                background: C.bg,
                borderRadius: 18,
                padding: '28px 24px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 13,
                  background: C.primaryLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.primaryDark, marginBottom: 18,
                }}>
                  <Icon d={step.icon} size={26} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.g900, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────────── */}
      <section id="about" style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: C.g900, marginBottom: 10 }}>About</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
            {/* Challenge */}
            <div style={{ flex: '1 1 360px', background: C.surface, borderRadius: 20, padding: '32px 28px', border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: C.g900, marginBottom: 16 }}>The Challenge</h3>
              <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.7, marginBottom: 16 }}>
                Currently, the Department of Agriculture Bantay Presyo publishes price data as scanned images converted into PDF documents containing long lists of commodities and their weekly prices.
              </p>
              <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.7, marginBottom: 16 }}>
                Many consumers cannot easily read or navigate these documents because:
              </p>
              <div style={{ background: '#fef2f2', borderRadius: 12, padding: '16px 20px', border: '1px solid #fee2e2' }}>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {[
                    'The text is small and difficult to read.',
                    'The document is lengthy and hard to search.',
                    'Many consumers / vendors are not digitally familiar.',
                    'Some consumers / vendors are elderly or visually impaired.',
                  ].map((item, i) => (
                    <li key={i} style={{ fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: i < 3 ? 4 : 0 }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Solution */}
            <div style={{ flex: '1 1 360px', background: C.surface, borderRadius: 20, padding: '32px 28px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primaryDark }}>
                  <Icon d={Icons.zap} size={22} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: C.g900 }}>Our Solution</h3>
              </div>
              <p style={{ fontSize: 15, color: C.textSecondary, lineHeight: 1.7, marginBottom: 20 }}>
                The proposed system converts these static PDF price reports into an interactive, mobile-friendly verification system accessible from any smartphone or tablet browser — <strong>no installation required</strong>.
              </p>
              <div style={{ background: C.primaryLight, borderRadius: 14, padding: '18px 20px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.g800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Core System Flow</p>
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  {[
                    'Open the Website on any browser-enabled device.',
                    'Camera captures image of the commodity.',
                    'YOLO26 inference identifies the item.',
                    'Latest official price retrieved from database.',
                    'Price displayed clearly on screen.',
                    'Scan event logged for analytics.',
                  ].map((step, i) => (
                    <li key={i} style={{ fontSize: 14, color: C.g800, lineHeight: 1.7, marginBottom: i < 5 ? 4 : 0 }}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 24px', background: C.surface }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/Alescan-Logo.png" alt="Alescan" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, color: C.text}}>2026 ALESCAN</span>
          </div>
        </div>
      </footer>
    </div>
  )
}