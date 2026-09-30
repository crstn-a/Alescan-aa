// frontend/src/components/DashboardNavbar.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserAuth } from '../hooks/useUserAuth';

const C = {
  primary: '#22c55e',
  primaryDark: '#16a34a',
  g900: '#052e16',
  g800: '#14532d',
  g700: '#166534',
  g100: '#dcfce7',
  g50: '#f0fdf4',
  bg: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  red600: '#dc2626',
  red50: '#fef2f2',
};

export default function DashboardNavbar({
  active = 'commodities', // 'commodities' | 'report' | 'scanner'
  onCommodityClick,
  onReportClick,
  onSignOutClick,
}) {
  const navigate = useNavigate();
  const { authed, user } = useUserAuth();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 640);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogoClick = (e) => {
    if (active === 'commodities' && onCommodityClick) {
      e.preventDefault();
      onCommodityClick(e);
    } else {
      navigate('/commodities');
    }
  };

  const handleSectionCommodity = (e) => {
    if (active === 'commodities') {
      e.preventDefault();
      if (onCommodityClick) onCommodityClick(e);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/commodities');
    }
  };

  const handleSectionReport = (e) => {
    if (active === 'report') {
      e.preventDefault();
      if (onReportClick) onReportClick(e);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/report');
    }
  };

  return (
    <header
      style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? '0 10px' : '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .dash-nav-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: all .15s ease;
          box-sizing: border-box;
        }
        .dash-nav-pill:hover {
          transform: translateY(-1px);
        }
        .dash-label-full { display: inline; }
        .dash-label-compact { display: none; }

        @media (max-width: 420px) {
          .dash-label-full { display: none !important; }
          .dash-label-compact { display: inline !important; }
        }
      `}</style>

      {/* ── Main Top Bar ── */}
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          height: isMobile ? 54 : 66,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Brand Logo & Title */}
        <div
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0,
          }}
          title={authed ? "Refresh Commodity Dashboard" : "Go to Alescan Home"}
        >
          <img
            src="/Alescan-Logo.png"
            alt="Alescan"
            style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, objectFit: 'contain' }}
          />
          <div>
            <span style={{ fontSize: isMobile ? 17 : 18, fontWeight: 800, color: C.g900, letterSpacing: '.02em' }}>
              ALESCAN
            </span>
            {!isMobile && (
              <span style={{ display: 'block', fontSize: 11, color: C.textSecondary, fontWeight: 500, lineHeight: 1 }}>
                Home Dashboard • {active === 'report' ? 'Price Concern Report' : 'Commodity Directory'}
              </span>
            )}
          </div>
        </div>

        {/* ── Nav Actions: Right Aligned Group ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
          {authed ? (
            <>
              {/* Desktop Nav Items (visible on screens >= 640px) */}
              {!isMobile && (
                <>
                  {/* 1. Commodity List Button */}
                  <Link
                    to="/commodities"
                    onClick={handleSectionCommodity}
                    className="dash-nav-pill"
                    style={{
                      background: active === 'commodities' ? C.g100 : C.g50,
                      border: `1.5px solid ${active === 'commodities' ? C.primaryDark : C.g100}`,
                      color: active === 'commodities' ? C.g800 : C.primaryDark,
                      padding: '8px 14px',
                      boxShadow: active === 'commodities' ? '0 2px 6px rgba(22,163,74,0.18)' : 'none',
                    }}
                    title="View Monitored Commodity Prices"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    <span>Commodity List</span>
                  </Link>

                  {/* 2. Scanner Button */}
                  <Link
                    to="/scanner"
                    className="dash-nav-pill"
                    style={{
                      background: active === 'scanner' ? C.g100 : C.g50,
                      border: `1.5px solid ${active === 'scanner' ? C.primaryDark : C.g100}`,
                      color: active === 'scanner' ? C.g800 : C.primaryDark,
                      padding: '8px 14px',
                    }}
                    title="Camera Scanner"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>Scanner</span>
                  </Link>

                  {/* 3. Report Concern Button */}
                  <Link
                    to="/report"
                    onClick={handleSectionReport}
                    className="dash-nav-pill"
                    style={{
                      background: active === 'report' ? C.g100 : C.g50,
                      border: `1.5px solid ${active === 'report' ? C.primaryDark : C.g100}`,
                      color: active === 'report' ? C.g800 : C.primaryDark,
                      padding: '8px 14px',
                      boxShadow: active === 'report' ? '0 2px 6px rgba(22,163,74,0.18)' : 'none',
                    }}
                    title="File Price Concern Report"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>Report Concern</span>
                  </Link>
                </>
              )}

              {/* 4. Main Profile CTA Button with Dropdown Popdown */}
              <div style={{ position: 'relative' }} ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  style={{
                    background: C.primaryDark,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: isMobile ? '7px 11px' : '8px 14px',
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.28)',
                    transition: 'all .15s ease',
                  }}
                  title="Account menu"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                >
                  <span style={{ fontSize: 13 }}>👤</span>
                  <span>
                    {isMobile
                      ? (user?.first_name || 'Account')
                      : (user?.first_name ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : 'My Account')}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform .2s ease',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Popdown dropdown */}
                {profileMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: '#fff',
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                      minWidth: 210,
                      maxWidth: 'min(280px, calc(100vw - 20px))',
                      zIndex: 1000,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                        {user?.first_name} {user?.last_name || ''}
                      </div>
                      {user?.email && (
                        <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2, wordBreak: 'break-all' }}>
                          {user.email}
                        </div>
                      )}
                      <div style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, color: C.primaryDark, background: C.g50, border: `1px solid ${C.g100}`, padding: '2px 6px', borderRadius: 4 }}>
                        Consumer Account
                      </div>
                    </div>

                    <div style={{ height: 1, background: C.border, margin: '2px 0' }} />

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        if (onSignOutClick) onSignOutClick();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 10px',
                        border: 'none',
                        borderRadius: 8,
                        background: 'transparent',
                        color: C.red600,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background .15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.red50)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Guest Nav Controls */
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
              <button
                onClick={() => navigate('/scanner')}
                style={{
                  background: C.g50,
                  border: `1px solid ${C.g100}`,
                  color: C.primaryDark,
                  borderRadius: 10,
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>{isMobile ? 'Scan' : 'Scanner'}</span>
              </button>
              <Link
                to="/user/login?redirect=/commodities"
                style={{
                  padding: '8px 10px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.textSecondary,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/user/signup?redirect=/commodities"
                style={{
                  background: C.primaryDark,
                  color: '#fff',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Section Tab Bar (Screens < 640px for Authenticated User) ── */}
      {authed && isMobile && (
        <div style={{ padding: '0 0 8px 0', width: '100%' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 5,
              background: C.bg,
              padding: '3px',
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Commodity List Tab */}
            <Link
              to="/commodities"
              onClick={handleSectionCommodity}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '7px 2px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                background: active === 'commodities' ? C.g100 : 'transparent',
                border: `1px solid ${active === 'commodities' ? C.primaryDark : 'transparent'}`,
                color: active === 'commodities' ? C.g800 : C.textSecondary,
                whiteSpace: 'nowrap',
                boxShadow: active === 'commodities' ? '0 1px 4px rgba(22,163,74,0.18)' : 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span className="dash-label-full">Commodity List</span>
              <span className="dash-label-compact">List</span>
            </Link>

            {/* Scanner Tab */}
            <Link
              to="/scanner"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '7px 2px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                background: active === 'scanner' ? C.g100 : 'transparent',
                border: `1px solid ${active === 'scanner' ? C.primaryDark : 'transparent'}`,
                color: active === 'scanner' ? C.g800 : C.textSecondary,
                whiteSpace: 'nowrap',
                boxShadow: active === 'scanner' ? '0 1px 4px rgba(22,163,74,0.18)' : 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="dash-label-full">Scanner</span>
              <span className="dash-label-compact">Scan</span>
            </Link>

            {/* Report Concern Tab */}
            <Link
              to="/report"
              onClick={handleSectionReport}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '7px 2px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                background: active === 'report' ? C.g100 : 'transparent',
                border: `1px solid ${active === 'report' ? C.primaryDark : 'transparent'}`,
                color: active === 'report' ? C.g800 : C.textSecondary,
                whiteSpace: 'nowrap',
                boxShadow: active === 'report' ? '0 1px 4px rgba(22,163,74,0.18)' : 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="dash-label-full">Report Concern</span>
              <span className="dash-label-compact">Report</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
