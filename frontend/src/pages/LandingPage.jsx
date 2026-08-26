// frontend/src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import TermsModal from '../components/TermsModal'

const C = {
  primary: '#22c55e',
  primaryDark: '#16a34a',
  g900: '#052e16',
  g800: '#14532d',
  primaryLight: '#f0fdf4',
  bg: '#f9fafb',
  surface: '#ffffff',
  border: '#f3f4f6',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
}

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const Icons = {
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  checkCircle: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3",
  database: "M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3 M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6 M4 12c0 1.657 3.582 3 8 3s8-1.343 8-3",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap: "M13 2L3 14h8l-2 8 10-12h-8l2-8z",
  menu: "M3 12h18M3 6h18M3 18h18",
  close: "M18 6L6 18M6 18L18 6M6 6l12 12",
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

  // Detect screen size for responsive menu rendering
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Close mobile menu when clicking a link or resizing to desktop
  const closeMobileMenu = () => setMobileMenuOpen(false)

  const handleStartScanning = () => {
    setShowTermsModal(true)
    closeMobileMenu()
  }

  const handleAgreeTerms = () => {
    try {
      localStorage.setItem('alescan_terms_accepted', 'true')
    } catch (err) {
      console.warn('localStorage error:', err)
    }
    setShowTermsModal(false)
    navigate('/scanner')
  }

  const handleCancelTerms = () => {
    setShowTermsModal(false)
  }

  const handleNavClick = (e, targetId) => {
    e.preventDefault()
    if (targetId === 'scanner') {
      handleStartScanning()
    } else {
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    closeMobileMenu()
  }

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

        /* Responsive adjustments */
        @media (max-width: 768px) {
          section {
            padding: 40px 16px !important;
          }
          .stats-row {
            gap: 24px !important;
            justify-content: space-between;
          }
          .stats-row > div {
            flex: 1;
            min-width: 100px;
          }
          .stats-row p:first-child {
            font-size: 11px !important;
          }
          .stats-row p:last-child {
            font-size: 16px !important;
          }
          .hero-title {
            font-size: 32px !important;
            line-height: 1.2 !important;
          }
          .cta-buttons {
            flex-direction: column;
            gap: 12px !important;
          }
          .cta-buttons button {
            width: 100%;
            justify-content: center;
          }
          .solution-list ol, .challenge-list ul {
            font-size: 13px !important;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 28px !important;
          }
          .stats-row {
            flex-wrap: wrap;
            gap: 20px !important;
          }
          .stats-row > div {
            flex-basis: calc(50% - 20px);
          }
        }
      `}</style>

      {/* Responsive Header: Desktop or Mobile */}
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
          {/* Logo - common for both layouts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/Alescan-Logo.png"
              alt="Alescan"
              style={{ width: 40, height: 40, objectFit: 'contain' }}
            />
          </div>

          {!isMobile ? (
            // Desktop Navigation: horizontal links + button
            <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <a href="#home" className="nav-link" style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none' }}>Home</a>
              <a href="#how-it-works" className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary, textDecoration: 'none' }}>How it works</a>
              <a href="#about" className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary, textDecoration: 'none' }}>About</a>
              <a href="#report" className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: C.textSecondary, textDecoration: 'none' }}>Report</a>
              <button
                className="use-scanner-btn"
                onClick={handleStartScanning}
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
          ) : (
            // Mobile Navigation: Hamburger button + collapsible menu
            <>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.text,
                  cursor: 'pointer',
                }}
                aria-label="Menu"
              >
                <Icon d={mobileMenuOpen ? Icons.close : Icons.menu} size={28} />
              </button>

              {/* Mobile Dropdown Menu */}
              {mobileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 72,
                  left: 0,
                  right: 0,
                  background: C.surface,
                  borderBottom: `1px solid ${C.border}`,
                  boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  zIndex: 100,
                }}>
                  <a
                    href="#home"
                    className="nav-link"
                    onClick={(e) => handleNavClick(e, 'home')}
                    style={{ fontSize: 16, fontWeight: 600, color: C.text, textDecoration: 'none', padding: '8px 0' }}
                  >
                    Home
                  </a>
                  <a
                    href="#how-it-works"
                    className="nav-link"
                    onClick={(e) => handleNavClick(e, 'how-it-works')}
                    style={{ fontSize: 16, fontWeight: 500, color: C.textSecondary, textDecoration: 'none', padding: '8px 0' }}
                  >
                    How it works
                  </a>
                  <a
                    href="#about"
                    className="nav-link"
                    onClick={(e) => handleNavClick(e, 'about')}
                    style={{ fontSize: 16, fontWeight: 500, color: C.textSecondary, textDecoration: 'none', padding: '8px 0' }}
                  >
                    About
                  </a>
                  <a
                    href="#report"
                    className="nav-link"
                    onClick={(e) => handleNavClick(e, 'report')}
                    style={{ fontSize: 16, fontWeight: 500, color: C.textSecondary, textDecoration: 'none', padding: '8px 0' }}
                  >
                    Report
                  </a>
                  <button
                    className="use-scanner-btn"
                    onClick={handleStartScanning}
                    style={{
                      background: C.primaryDark,
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 20px',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#fff',
                      transition: 'all 0.15s',
                      marginTop: 8,
                      width: '100%',
                    }}
                  >
                    Use Scanner
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── Hero ── with right panel image ───────────────────────── */}
      <section id="home" style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Two-column layout: left text + right image, responsive via isMobile */}
          <div style={{
            display: 'grid',
            gap: 40,
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            alignItems: 'center',
          }}>
            {/* Left column: content with constrained max-width for readability */}
            <div>
              <div style={{ maxWidth: 640 }}>
                {/* Badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: C.primaryLight, borderRadius: 40,
                  padding: '4px 14px', width: 'fit-content',
                  border: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.g800 }}>
                    Olongapo City Public Market • Department of Agriculture Bantay Presyo
                  </span>
                </div>

                {/* Title */}
                <h1 style={{
                  fontSize: 'clamp(32px, 7vw, 56px)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: C.g900,
                  margin: '16px 0 0 0',
                }}>
                  Verify Market Prices<br />
                  <span style={{ color: C.primaryDark }}>Instantly with your Camera</span>
                </h1>

                {/* Subtitle */}
                <p style={{
                  fontSize: 17,
                  color: C.textSecondary,
                  lineHeight: 1.65,
                  margin: '16px 0 4px',
                }}>
                  A Vision-Based Centralized Price Verification Scanner for Public Markets
                  Using Open-Vocabulary Computer Vision and Automated Price Synchronization from the
                  Department of Agriculture Bantay Presyo Monthly Sheet.
                </p>

                {/* CTA Buttons */}
                <div className="cta-buttons" style={{ display: 'flex', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
                  <button
                    className="start-scanning-btn"
                    onClick={handleStartScanning}
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

                {/* Stats row (responsive) */}
                <div className="stats-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 40, marginTop: 48 }}>
                  {[
                    { top: 'Updated Monthly', bot: 'DA Bantay Presyo' },
                    { top: 'Powered by', bot: 'YOLO-World AI' },
                    { top: 'No Installation', bot: 'Works in Browser' },
                  ].map((s, i) => (
                    <div key={i}>
                      <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>{s.top}</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: C.g900 }}>{s.bot}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: market image with corner radius */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
              <img
                src="/OlongapoCityPublicMarket.jpg"
                alt="Olongapo Public Market - Monitored market price reference and verification example"
                style={{
                  width: '100%',
                  maxWidth: '90%',
                  borderRadius: '28px',
                  boxShadow: '0 20px 30px -12px rgba(0,0,0,0.2)',
                  border: `1px solid ${C.border}`,
                  objectFit: 'cover',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                className="hover-lift"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '60px 24px', background: C.surface }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 34px)', fontWeight: 800, color: C.g900, marginBottom: 10 }}>How it Works</h2>
            <p style={{ fontSize: 17, color: C.textSecondary }}>Simple, fast, and accessible to everyone.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 24 }}>
            {[
              { icon: Icons.camera, title: '1. Open Scanner', desc: 'Access the scanner directly from your phone or tablet browser. No app installation required.' },
              { icon: Icons.shield, title: '2. Tap to Scan', desc: 'Frame your commodity and tap scan. Server-side AI identifies the item.' },
              { icon: Icons.checkCircle, title: '3. Verify Price', desc: 'Instantly see the prevailing price and monitored range from DA Bantay Presyo.' },
              { icon: Icons.database, title: '4. Stay Informed', desc: 'All scans are logged to help monitor retail market price transparency.' },
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
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Header & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: C.primaryLight, borderRadius: 40,
              padding: '4px 14px', width: 'fit-content',
              border: `1px solid ${C.border}`, marginBottom: 12
            }}>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, color: C.g900, marginBottom: 12 }}>
              Smart Market Price Verification
            </h2>
            <p style={{ fontSize: 16, color: C.textSecondary, maxWidth: 680, margin: '0 auto', lineHeight: 1.6 }}>
              Discover how ALESCAN simplifies market price checking using AI camera recognition and official Department of Agriculture Bantay Presyo data.
            </p>
          </div>

          {/* Centered Video Player */}
          <div style={{
            maxWidth: 840,
            margin: '0 auto 48px auto',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 16px 40px -12px rgba(0,0,0,0.15)',
            border: `1px solid ${C.border}`,
            background: '#000',
            lineHeight: 0
          }}>
            <video
              controls
              playsInline
              preload="metadata"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '520px',
                objectFit: 'contain',
                display: 'block'
              }}
            >
              <source src="/About_Video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>


      {/* ── Report a Vendor ────────────────────────────────────────── */}
      <section id="report" style={{ padding: '60px 24px', background: C.surface }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#fef2f2', borderRadius: 40,
              padding: '4px 14px', width: 'fit-content',
              border: '1px solid #fee2e2', marginBottom: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
                🛡️ Consumer Protection
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, color: C.g900, marginBottom: 12 }}>
              Report Overpriced Vendors
            </h2>
            <p style={{ fontSize: 16, color: C.textSecondary, maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
              Spotted a vendor selling above the suggested retail price? Help keep market prices fair by filing a report.
              Your submission becomes a task ticket for our Market Officers.
            </p>
          </div>

          {/* 3-Step Visual Guide */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24, marginBottom: 40 }}>
            {[
              {
                step: '1',
                icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M20 8v6M23 11h-6',
                title: 'Create an Account',
                desc: 'Sign up with your name, email, and phone number. It only takes a minute.',
              },
              {
                step: '2',
                icon: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3',
                title: 'Sign In',
                desc: 'Log in with your email and password to access the reporting system.',
              },
              {
                step: '3',
                icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8M16 17H8M10 9H8',
                title: 'Submit Your Report',
                desc: 'Fill in vendor details, commodity, and the price you saw. A Market Officer will handle it.',
              },
            ].map((s, i) => (
              <div key={i} className="step-card" style={{
                background: C.bg,
                borderRadius: 18,
                padding: '28px 24px',
                border: `1px solid ${C.border}`,
                position: 'relative',
              }}>
                {/* Step number badge */}
                <div style={{
                  position: 'absolute', top: -12, left: 24,
                  width: 28, height: 28, borderRadius: 8,
                  background: C.primaryDark, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(22,101,52,.3)',
                }}>
                  {s.step}
                </div>
                <div style={{
                  width: 52, height: 52, borderRadius: 13,
                  background: C.primaryLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.primaryDark, marginBottom: 18, marginTop: 8,
                }}>
                  <Icon d={s.icon} size={26} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.g900, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="start-scanning-btn"
              onClick={() => navigate('/user/signup')}
              style={{
                background: C.primaryDark,
                border: 'none',
                borderRadius: 12,
                padding: '15px 36px',
                fontSize: 16,
                fontWeight: 700,
                color: '#fff',
                transition: 'all 0.15s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(22,101,52,.25)',
                cursor: 'pointer',
              }}
            >
              <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8M16 17H8M10 9H8" size={18} />
              Report a Vendor Now
            </button>
            <p style={{ fontSize: 13, color: C.textMuted, marginTop: 12 }}>
              Already have an account?{' '}
              <span
                onClick={() => navigate('/user/login')}
                style={{ color: C.primaryDark, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign in here
              </span>
            </p>
          </div>
        </div>
      </section>


      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 24px', background: C.surface }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/Alescan-Logo.png" alt="Alescan" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, color: C.text }}>2026 ALESCAN</span>
          </div>
        </div>
      </footer>

      {/* Terms & Conditions Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onAgree={handleAgreeTerms}
        onCancel={handleCancelTerms}
      />
    </div>
  )
}