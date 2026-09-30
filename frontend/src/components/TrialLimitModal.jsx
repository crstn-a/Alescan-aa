// frontend/src/components/TrialLimitModal.jsx
import { useNavigate } from 'react-router-dom';

const C = {
  primary: '#22c55e',
  primaryDark: '#16a34a',
  g900: '#052e16',
  g800: '#14532d',
  g700: '#166534',
  g100: '#dcfce7',
  g50: '#f0fdf4',
  bg: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  amber50: '#fffbeb',
  amber600: '#d97706',
  amber100: '#fef3c7',
};

export default function TrialLimitModal({
  isOpen,
  onClose,
  usedCount = 5,
  maxCount = 5,
  redirectUrl = '/scanner',
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignup = () => {
    navigate(`/user/signup?redirect=${encodeURIComponent(redirectUrl)}`);
  };

  const handleLogin = () => {
    navigate(`/user/login?redirect=${encodeURIComponent(redirectUrl)}`);
  };

  const benefits = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primaryDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: 'More Tries of Scanning Commodities',
      desc: 'Unlock extended scanning access with no strict 5-scan cap to verify market prices anytime.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primaryDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      title: 'Report Price Concerns',
      desc: 'Spotted an overpriced vendor? Submit price reports directly to Market Officers for inspection.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.primaryDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      title: 'Search Overall Commodity Prices',
      desc: 'Browse and search the entire directory of monitored commodities and official DA Bantay Presyo rates.',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn .2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.bg,
          borderRadius: 20,
          maxWidth: 440,
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'fadeUp .25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent strip */}
        <div
          style={{
            background: `linear-gradient(135deg, ${C.g800} 0%, ${C.primaryDark} 100%)`,
            padding: '24px 24px 20px',
            color: '#fff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.18)',
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              Guest Scan Limit
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                background: 'rgba(0,0,0,0.25)',
                padding: '3px 8px',
                borderRadius: 8,
              }}
            >
              {usedCount} / {maxCount} Tries Used
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#fff', lineHeight: 1.25 }}>
            Free Trial Limit Reached
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
            To prevent spam and keep the scanner reliable for all consumers, guest scanning is limited to {maxCount} tries. Sign up as an actual user to unlock full features.
          </p>
        </div>

        {/* Benefits list */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 12 }}>
            What you unlock with a free account:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {benefits.map((b, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 12px',
                  background: C.surface,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: C.g100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {b.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>
                    {b.title}
                  </h4>
                  <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.4 }}>
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleSignup}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 12,
                border: 'none',
                background: C.primaryDark,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              Sign Up as Actual User
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '11px 20px',
                borderRadius: 12,
                border: `1.5px solid ${C.border}`,
                background: '#fff',
                color: C.text,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Already have an account? Sign In
            </button>

            {onClose && (
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: C.textMuted,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Close & Return Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
