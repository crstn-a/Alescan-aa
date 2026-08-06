import { useEffect } from 'react'

const C = {
  primary: '#22c55e',
  primaryDark: '#16a34a',
  g900: '#052e16',
  g800: '#14532d',
  primaryLight: '#f0fdf4',
  bg: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
}

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const Icons = {
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  check: "M20 6L9 17l-5-5",
  close: "M18 6L6 18M6 18L18 6",
  fileText: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
}

export default function TermsModal({ isOpen, onAgree, onCancel }) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 46, 22, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onCancel}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .terms-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .terms-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .terms-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .terms-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div
        style={{
          background: C.surface,
          borderRadius: 20,
          boxShadow: '0 20px 40px -10px rgba(5,46,22,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
          maxWidth: 620,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${C.primaryLight} 0%, #ffffff 100%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: C.primaryDark,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(22,163,74,0.3)',
            }}>
              <Icon d={Icons.shield} size={22} />
            </div>
            <div>
              <h2 style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.g900,
                margin: 0,
                lineHeight: 1.2
              }}>
                Terms and Conditions
              </h2>
              <p style={{
                fontSize: 13,
                color: C.textSecondary,
                margin: '2px 0 0 0'
              }}>
                Alescan SRP Scanner Usage Agreement
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              padding: 8,
              cursor: 'pointer',
              color: C.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = '#f3f4f6' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = 'transparent' }}
            aria-label="Close modal"
          >
            <Icon d={Icons.close} size={20} />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div
          className="terms-scroll"
          style={{
            padding: '24px',
            overflowY: 'auto',
            fontSize: 14,
            lineHeight: 1.6,
            color: C.text,
            flex: 1,
          }}
        >
          {/* Intro Callout */}
          <div style={{
            background: C.primaryLight,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 20,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <span style={{ color: C.primaryDark, marginTop: 2 }}>
              <Icon d={Icons.camera} size={20} />
            </span>
            <div style={{ fontSize: 13, color: C.g800, lineHeight: 1.5 }}>
              <strong>Before using the scanner:</strong> Please review how Alescan processes price tag scans and utilizes camera permissions in accordance with DA Bantay Presyo guidelines.
            </div>
          </div>

          {/* Detailed Terms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <section>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: '0 0 6px 0' }}>
                1. Acceptance of Terms
              </h3>
              <p style={{ margin: 0, color: C.textSecondary }}>
                By accessing or using the Alescan web application, scanner interface, or associated services, you agree to be bound by these Terms and Conditions. If you do not agree, please click Cancel to exit.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: '0 0 6px 0' }}>
                2. Description of Service
              </h3>
              <p style={{ margin: 0, color: C.textSecondary }}>
                Alescan provides a vision-based scanner for public market consumers and market authorities in Olongapo City. It enables live camera-based commodity price scanning and automatic verification against official Department of Agriculture (DA) Bantay Presyo Suggested Retail Price (SRP) benchmarks.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: '0 0 6px 0' }}>
                3. Camera & Device Permissions
              </h3>
              <p style={{ margin: 0, color: C.textSecondary }}>
                Alescan requires camera permissions strictly to perform real-time optical character recognition (OCR) and object recognition on price tags. Alescan does not capture, store, or transmit personal photos or video recordings of users.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: '0 0 6px 0' }}>
                4. Data Privacy & Analytics
              </h3>
              <p style={{ margin: 0, color: C.textSecondary }}>
                Anonymized scan telemetry (e.g., commodity name, detected price, and scan timestamp) is processed to update market monitoring analytics. No personally identifiable information (PII) is gathered or sold.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: '0 0 6px 0' }}>
                5. Price Accuracy & SRP Disclaimer
              </h3>
              <p style={{ margin: 0, color: C.textSecondary }}>
                SRP references are synchronized from official Department of Agriculture updates. The scan results serve as an informational verification guide. Formal regulatory price enforcement remains under authorized government agencies.
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: '0 0 6px 0' }}>
                6. User Conduct
              </h3>
              <p style={{ margin: 0, color: C.textSecondary }}>
                Users agree to operate the scanner respectfully within public market premises, without disrupting market stall operations or attempting to misuse the application.
              </p>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${C.border}`,
          background: C.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '11px 20px',
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.surface }}
          >
            Cancel
          </button>

          <button
            onClick={onAgree}
            style={{
              padding: '11px 24px',
              borderRadius: 10,
              border: 'none',
              background: C.primaryDark,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.g800 }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.primaryDark }}
          >
            <Icon d={Icons.check} size={18} />
            I Agree & Continue
          </button>
        </div>
      </div>
    </div>
  )
}
