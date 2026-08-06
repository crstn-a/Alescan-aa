import { useState, useEffect } from 'react'

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
  warning: '#f59e0b',
  warningLight: '#fffbeb',
}

const Icon = ({ d, d2, size = 20, strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
)

const Icons = {
  help: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01",
  close: "M18 6L6 18M6 18L18 6",
  chevronRight: "M9 18l6-6-6-6",
  chevronLeft: "M15 18l-6-6 6-6",
  globe: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 0c-2.5 3-4 6.5-4 10s1.5 7 4 7 4-3.5 4-7-1.5-7-4-7zM2 12h20",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  target: "M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6z M12 10a2 2 0 1 0 2 2 2 2 0 0 0-2-2z",
  aperture: "M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z M14.31 8l5.74 9.94 M9.69 8h11.48 M7.38 12l5.74-9.94 M9.69 16L3.95 6.06 M14.31 16H2.83 M16.62 12l-5.74 9.94",
  fileText: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  logOut: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  alertTriangle: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  check: "M20 6L9 17l-5-5"
}

const steps = [
  {
    step: 1,
    title: "Open ALESCAN",
    icon: Icons.globe,
    content: "Open ALESCAN using your preferred web browser on a smartphone or tablet.",
  },
  {
    step: 2,
    title: "Start Scanning",
    icon: Icons.camera,
    content: "Tap the Start Scanning button. If prompted, allow camera access.",
  },
  {
    step: 3,
    title: "Position the Product",
    icon: Icons.target,
    content: "Hold your phone approximately 20–30 cm away from the product.",
    bullets: [
      "The product is inside the green frame.",
      "There is sufficient lighting.",
      "Only one supported commodity is visible."
    ]
  },
  {
    step: 4,
    title: "Capture the Scan",
    icon: Icons.aperture,
    content: "When the product name appears on the screen, tap the Scan button. The application will capture the image and process it."
  },
  {
    step: 5,
    title: "Review the Result",
    icon: Icons.fileText,
    content: "The result page displays detailed SRP compliance information:",
    bullets: [
      "Detected commodity",
      "Official Suggested Retail Price (SRP)",
      "Detection confidence",
      "Price source",
      "Latest update week"
    ],
    footerNote: "Review the information before making any purchasing decisions."
  },
  {
    step: 6,
    title: "Scan Another Commodity",
    icon: Icons.refresh,
    content: "Tap Scan Another Commodity to return to the scanner for your next item."
  },
  {
    step: 7,
    title: "Exit the Scanner",
    icon: Icons.logOut,
    content: "Tap Exit to return to the home page whenever you are finished."
  }
]

const reminders = [
  "ALESCAN is intended as a public information tool.",
  "Always verify the scanned product before relying on the displayed result.",
  "The displayed SRP serves only as a government reference.",
  "Poor lighting or incorrect camera positioning may reduce detection accuracy.",
  "Use the application responsibly and report any suspected pricing violations to the appropriate government authority."
]

export default function TutorialModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [viewMode, setViewMode] = useState('slides') // 'slides' | 'all'

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

  const activeStep = steps[currentStep]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 46, 22, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
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
        .tutorial-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .tutorial-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .tutorial-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>

      <div
        style={{
          background: C.surface,
          borderRadius: 20,
          boxShadow: '0 20px 40px -10px rgba(5,46,22,0.3), 0 0 0 1px rgba(0,0,0,0.05)',
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
          padding: '18px 24px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${C.primaryLight} 0%, #ffffff 100%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: C.primaryDark,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(22,163,74,0.3)',
            }}>
              <Icon d={Icons.help} size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.g900, margin: 0 }}>
                How to Use ALESCAN
              </h2>
              <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 0 0' }}>
                Step-by-step Scanner Guide & Guidelines
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'slides' ? 'all' : 'slides')}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.primaryDark,
                background: C.primaryLight,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {viewMode === 'slides' ? 'View All Steps' : 'Step-by-Step View'}
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                color: C.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close tutorial"
            >
              <Icon d={Icons.close} size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="tutorial-scroll"
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {viewMode === 'slides' ? (
            /* Step-by-Step Slide View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
              {/* Step Progress Dots */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {steps.map((s, idx) => (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(idx)}
                    style={{
                      height: 8,
                      width: idx === currentStep ? 24 : 8,
                      borderRadius: 4,
                      background: idx === currentStep ? C.primaryDark : C.border,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title={`Step ${s.step}: ${s.title}`}
                  />
                ))}
              </div>

              {/* Active Step Card */}
              <div style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: C.primaryLight,
                    color: C.primaryDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon d={activeStep.icon} size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.primaryDark, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      Step {activeStep.step} of {steps.length}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: C.g900, margin: '2px 0 0 0' }}>
                      {activeStep.title}
                    </h3>
                  </div>
                </div>

                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.6, margin: 0 }}>
                  {activeStep.content}
                </p>

                {activeStep.bullets && (
                  <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {activeStep.bullets.map((b, i) => (
                        <li key={i} style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.5 }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeStep.footerNote && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.primaryDark, margin: 0 }}>
                    {activeStep.footerNote}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Full Guide View (All Steps List) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {steps.map((s) => (
                <div key={s.step} style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: '16px 20px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: C.primaryLight,
                    color: C.primaryDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon d={s.icon} size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: C.primaryDark,
                        color: '#fff',
                        borderRadius: 6,
                        padding: '2px 8px',
                      }}>
                        Step {s.step}
                      </span>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: 0 }}>
                        {s.title}
                      </h4>
                    </div>
                    <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.5, margin: 0 }}>
                      {s.content}
                    </p>

                    {s.bullets && (
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {s.bullets.map((b, idx) => (
                          <li key={idx} style={{ fontSize: 13, color: C.textSecondary }}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Important Reminders Section */}
          <div style={{
            background: C.warningLight,
            border: '1px solid #fde68a',
            borderRadius: 14,
            padding: '16px 20px',
            marginTop: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ color: C.warning, display: 'flex' }}>
                <Icon d={Icons.alertTriangle} size={20} />
              </span>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#92400e', margin: 0 }}>
                Important Reminders
              </h4>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reminders.map((r, i) => (
                <li key={i} style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${C.border}`,
          background: C.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {viewMode === 'slides' ? (
            <>
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: currentStep === 0 ? C.textMuted : C.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: currentStep === 0 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: currentStep === 0 ? 0.6 : 1,
                }}
              >
                <Icon d={Icons.chevronLeft} size={16} />
                Previous
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: C.primaryDark,
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                  }}
                >
                  Next Step
                  <Icon d={Icons.chevronRight} size={16} />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: C.primaryDark,
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                  }}
                >
                  <Icon d={Icons.check} size={18} />
                  Got it, Start Scanning
                </button>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: C.primaryDark,
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon d={Icons.check} size={18} />
                Got it, Start Scanning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
