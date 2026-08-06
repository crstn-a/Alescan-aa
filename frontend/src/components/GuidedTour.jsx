import { useState, useEffect, useRef } from 'react'

const C = {
  primary: '#22c55e',
  primaryDark: '#16a34a',
  g900: '#052e16',
  g800: '#14532d',
  primaryLight: '#f0fdf4',
  bg: '#ffffff',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
}

const Icon = ({ d, d2, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
)

const Icons = {
  close: "M18 6L6 18M6 18L18 6",
  chevronRight: "M9 18l6-6-6-6",
  chevronLeft: "M15 18l-6-6 6-6",
  check: "M20 6L9 17l-5-5",
  sparkles: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
}

const tourSteps = [
  {
    targetId: 'tour-header-logo',
    title: 'Step 1 – Welcome to ALESCAN',
    description: 'ALESCAN is a vision-based scanner for verifying public market commodity prices against official Department of Agriculture (DA) Bantay Presyo SRP data.',
    placement: 'bottom',
  },
  {
    targetId: 'tour-status-indicator',
    title: 'Step 2 – Camera Status & Permissions',
    description: 'Ensure your camera permission is allowed. The live status pill shows when your camera feed is active and ready for scanning.',
    placement: 'bottom',
  },
  {
    targetId: 'tour-scan-frame',
    title: 'Step 3 – Position the Product',
    description: 'Hold your phone 20–30 cm away from the commodity. Ensure the product is inside the green frame under good lighting with only one commodity visible.',
    placement: 'center',
  },
  {
    targetId: 'tour-commodity-label',
    title: 'Step 4 – Live Product Detection',
    description: 'When computer vision identifies the item, the recognized commodity name will appear on screen right above the scan button.',
    placement: 'top',
  },
  {
    targetId: 'tour-scan-btn',
    title: 'Step 5 – Capture & Verify SRP',
    description: 'Tap the Scan button to capture the image. ALESCAN will process the frame and retrieve the official Suggested Retail Price (SRP).',
    placement: 'top',
  },
  {
    targetId: 'tour-exit-btn',
    title: 'Step 6 – Navigation & Exit',
    description: 'Tap Exit anytime to return to the home page, or tap Guide to replay this walkthrough tutorial whenever needed.',
    placement: 'bottom',
  },
  {
    targetId: null,
    title: 'Step 7 – Important Reminders',
    description: 'ALESCAN is a public information reference tool. Always verify scanned products and report suspected price violations to local market authorities.',
    placement: 'center',
    isFinal: true,
  }
]

export default function GuidedTour({ active, onComplete, onSkip }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const popoverRef = useRef(null)

  const currentStep = tourSteps[currentStepIndex]

  // Update target rect when step changes or window resizes
  useEffect(() => {
    if (!active || !currentStep) return

    const updateRect = () => {
      if (currentStep.targetId) {
        const el = document.getElementById(currentStep.targetId)
        if (el) {
          const rect = el.getBoundingClientRect()
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          })
          return
        }
      }
      setTargetRect(null)
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)

    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [active, currentStepIndex, currentStep])

  if (!active || !currentStep) return null

  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === tourSteps.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete?.()
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  // Calculate Popover Position
  let popoverStyle = {
    position: 'fixed',
    zIndex: 10002,
    maxWidth: 380,
    width: 'calc(100vw - 32px)',
    background: C.surface,
    borderRadius: 18,
    padding: '20px',
    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)',
    animation: 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  }

  if (targetRect && currentStep.placement !== 'center') {
    if (currentStep.placement === 'bottom') {
      popoverStyle.top = Math.min(window.innerHeight - 240, targetRect.top + targetRect.height + 12)
      popoverStyle.left = Math.max(16, Math.min(window.innerWidth - 396, targetRect.left + targetRect.width / 2 - 190))
    } else if (currentStep.placement === 'top') {
      popoverStyle.bottom = Math.min(window.innerHeight - 60, window.innerHeight - targetRect.top + 12)
      popoverStyle.left = Math.max(16, Math.min(window.innerWidth - 396, targetRect.left + targetRect.width / 2 - 190))
    }
  } else {
    // Center modal
    popoverStyle.top = '50%'
    popoverStyle.left = '50%'
    popoverStyle.transform = 'translate(-50%, -50%)'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'auto' }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseSpotlight {
          0%, 100% { box-shadow: 0 0 0 4px rgba(34,197,94,0.4), 0 0 0 9999px rgba(5,46,22,0.65); }
          50% { box-shadow: 0 0 0 8px rgba(34,197,94,0.7), 0 0 0 9999px rgba(5,46,22,0.65); }
        }
      `}</style>

      {/* Dimmed Overlay with Target Spotlight */}
      {targetRect ? (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 14,
            animation: 'pulseSpotlight 2s infinite',
            zIndex: 10001,
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      ) : (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 46, 22, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 10001,
          }}
          onClick={onSkip}
        />
      )}

      {/* Popover Step Card */}
      <div ref={popoverRef} style={popoverStyle} onClick={(e) => e.stopPropagation()}>
        {/* Step Badge & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: C.primaryLight,
              border: `1px solid ${C.border}`,
              color: C.primaryDark,
              fontSize: 12,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
            }}>
              Step {currentStepIndex + 1} of {tourSteps.length}
            </span>
          </div>

          <button
            onClick={onSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: C.textMuted,
              padding: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Skip Tour"
          >
            <Icon d={Icons.close} size={18} />
          </button>
        </div>

        {/* Step Content */}
        <h3 style={{ fontSize: 16, fontWeight: 800, color: C.g900, margin: '0 0 8px 0' }}>
          {currentStep.title}
        </h3>

        <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.5, margin: '0 0 20px 0' }}>
          {currentStep.description}
        </p>

        {/* Footer Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={handleBack}
            disabled={isFirst}
            style={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: isFirst ? C.textMuted : C.text,
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: isFirst ? 'default' : 'pointer',
              opacity: isFirst ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Icon d={Icons.chevronLeft} size={16} />
            Back
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isLast && (
              <button
                onClick={onSkip}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.textSecondary,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                background: C.primaryDark,
                border: 'none',
                color: '#ffffff',
                borderRadius: 10,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
              }}
            >
              {isLast ? (
                <>
                  <Icon d={Icons.check} size={16} />
                  Finish Tour
                </>
              ) : (
                <>
                  Next
                  <Icon d={Icons.chevronRight} size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
