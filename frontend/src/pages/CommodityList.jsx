// frontend/src/pages/CommodityList.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllPrices } from '../api/scanApi';
import { useUserAuth } from '../hooks/useUserAuth';

const SNEAK_PEEK_LIMIT = 22;

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
  amber50: '#fffbeb',
  amber700: '#b45309',
  amber100: '#fef3c7',
};

function getEmoji(name = '', category = '') {
  const text = (name + ' ' + category).toLowerCase();
  if (text.includes('pork') || text.includes('liempo') || text.includes('kasim')) return '🥩';
  if (text.includes('beef')) return '🥩';
  if (text.includes('chicken') || text.includes('poultry') || text.includes('egg')) return '🐔';
  if (text.includes('fish') || text.includes('tilapia') || text.includes('bangus') || text.includes('galunggong')) return '🐟';
  if (text.includes('rice')) return '🌾';
  if (text.includes('onion') || text.includes('garlic') || text.includes('ginger') || text.includes('spice')) return '🧄';
  if (text.includes('vegetable') || text.includes('tomato') || text.includes('cabbage') || text.includes('carrot') || text.includes('eggplant')) return '🥬';
  if (text.includes('fruit') || text.includes('banana') || text.includes('mango') || text.includes('calamansi')) return '🍎';
  return '🛒';
}

export default function CommodityList() {
  const navigate = useNavigate();
  const { authed, user, logout } = useUserAuth();

  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc' | 'price-asc' | 'price-desc'
  const [showAuthGateModal, setShowAuthGateModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

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

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/');
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (authed) {
      setSearch('');
      setSelectedCategory('All');
      setSortBy('name-asc');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    async function loadPrices() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllPrices();
        setPrices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load prices');
      } finally {
        setLoading(false);
      }
    }
    loadPrices();
  }, []);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set();
    prices.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [prices]);

  // Full filter and sort items (for authenticated users)
  const filteredPrices = useMemo(() => {
    let result = [...prices];

    if (selectedCategory !== 'All') {
      result = result.filter(
        (item) => (item.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((item) => {
        const name = (item.commodity_name || item.product || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const spec = (item.specification || '').toLowerCase();
        return name.includes(q) || cat.includes(q) || spec.includes(q);
      });
    }

    result.sort((a, b) => {
      const nameA = a.commodity_name || a.product || '';
      const nameB = b.commodity_name || b.product || '';
      const priceA = Number(a.price_prevailing ?? a.price_average ?? 0);
      const priceB = Number(b.price_prevailing ?? b.price_average ?? 0);

      if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      return 0;
    });

    return result;
  }, [prices, selectedCategory, search, sortBy]);

  // If unauthenticated, only show sneak peek of top 4 items
  const displayedPrices = useMemo(() => {
    if (!authed) {
      return prices.slice(0, SNEAK_PEEK_LIMIT);
    }
    return filteredPrices;
  }, [authed, prices, filteredPrices]);

  const lockedCount = Math.max(0, prices.length - SNEAK_PEEK_LIMIT);

  const handleReportItem = (item) => {
    if (!authed) {
      navigate('/user/login?redirect=' + encodeURIComponent('/commodities'));
      return;
    }
    // Navigate to report page with prefilled item state
    navigate('/report', {
      state: {
        commodity_name: item.commodity_name || item.product || '',
        price_seen: item.price_prevailing || '',
      },
    });
  };

  const handleSearchBoxClick = () => {
    if (!authed) {
      setShowAuthGateModal(true);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .comm-card{transition:all .18s ease}
        .comm-card:hover{transform:translateY(-2px);box-shadow:0 12px 24px -6px rgba(0,0,0,.08)}
        .cat-chip{transition:all .15s}
        .cat-chip:hover{border-color:${C.primaryDark}!important}
        .search-input:focus{border-color:${C.primaryDark}!important;box-shadow:0 0 0 3px rgba(34,197,94,.15)!important;outline:none}
      `}</style>

      {/* ── Top Header ────────────────────────────────────────── */}
      <header
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Logo & title */}
          <div
            onClick={handleLogoClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            title={authed ? "Refresh Commodity Dashboard" : "Go to Alescan Home"}
          >
            <img src="/Alescan-Logo.png" alt="Alescan" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.g900, letterSpacing: '.02em' }}>
                ALESCAN
              </span>
              <span style={{ display: 'block', fontSize: 11, color: C.textSecondary, fontWeight: 500, lineHeight: 1 }}>
                Home Dashboard • Commodity Directory
              </span>
            </div>
          </div>

          {/* Quick nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/scanner')}
              style={{
                background: C.g50,
                border: `1px solid ${C.g100}`,
                color: C.primaryDark,
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Scanner
            </button>

            {authed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link
                  to="/report"
                  style={{
                    background: C.g50,
                    border: `1px solid ${C.g100}`,
                    color: C.primaryDark,
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all .15s ease',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Report Concern
                </Link>

                {/* Main Profile CTA Button with Dropdown Popdown */}
                <div style={{ position: 'relative' }} ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    style={{
                      background: C.primaryDark,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.28)',
                      transition: 'all .15s ease',
                    }}
                    title="Account menu"
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="true"
                  >
                    <span>👤</span>
                    <span>{user?.first_name ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` : 'My Account'}</span>
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
                          setShowLogoutModal(true);
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
                          color: '#dc2626',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background .15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
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
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link
                  to="/user/login?redirect=/commodities"
                  style={{
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.textSecondary,
                    textDecoration: 'none',
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
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Area ───────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: 1240, width: '100%', margin: '0 auto', padding: '24px 20px 48px' }}>
        {/* Banner if logged in */}
        {authed && (
          <div
            style={{
              background: `linear-gradient(135deg, ${C.g900} 0%, ${C.g800} 100%)`,
              borderRadius: 18,
              padding: '24px 28px',
              color: '#fff',
              marginBottom: 24,
              boxShadow: '0 8px 24px rgba(5, 46, 22, 0.25)',
            }}
          >
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>
                Welcome back, {user?.first_name || 'Consumer'}! 👋
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.55 }}>
                Your centralized price verification center. Browse official DA Bantay Presyo market rates below.
              </p>
            </div>
          </div>
        )}

        {/* Title & Stats */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.g900, marginBottom: 4 }}>
              Monitored Commodity Prices
            </h1>
            <p style={{ fontSize: 14, color: C.textSecondary }}>
              Synchronized from Department of Agriculture (DA) Bantay Presyo • Olongapo City Public Market
            </p>
          </div>
          <div>
            {!authed ? (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#b45309',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  padding: '6px 14px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
              </div>
            ) : (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.textSecondary,
                  background: C.surface,
                  padding: '6px 14px',
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                }}
              >
                Showing <strong style={{ color: C.g800 }}>{filteredPrices.length}</strong> of {prices.length} commodities
              </div>
            )}
          </div>
        </div>

        {/* ── Search & Filter Controls (Gated for guests) ────────── */}
        <div
          style={{
            background: C.surface,
            borderRadius: 16,
            padding: '16px 20px',
            border: `1px solid ${C.border}`,
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            position: 'relative',
          }}
        >
          {/* Search bar & Sort row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                minWidth: 240,
                position: 'relative',
                cursor: !authed ? 'pointer' : 'default',
              }}
              onClick={handleSearchBoxClick}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={!authed ? '#9ca3af' : C.textMuted}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              >
                {!authed ? (
                  <>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </>
                ) : (
                  <>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </>
                )}
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder={
                  !authed
                    ? 'Full search is for registered members only — Tap to unlock'
                    : 'Search commodities by name, category, or specification...'
                }
                value={authed ? search : ''}
                readOnly={!authed}
                onChange={(e) => {
                  if (authed) setSearch(e.target.value);
                }}
                style={{
                  width: '100%',
                  height: 44,
                  padding: !authed ? '0 135px 0 42px' : '0 14px 0 42px',
                  borderRadius: 10,
                  border: `1.5px solid ${!authed ? 'rgba(245,158,11,0.4)' : C.border}`,
                  fontSize: 14,
                  background: !authed ? '#fffdf7' : C.bg,
                  color: C.text,
                  cursor: !authed ? 'pointer' : 'text',
                  transition: 'all .15s',
                }}
              />
              {!authed ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAuthGateModal(true);
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: C.primaryDark,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Unlock Search
                </button>
              ) : (
                search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: C.textMuted,
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: 4,
                    }}
                  >
                    ✕
                  </button>
                )
              )}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: C.textSecondary, fontWeight: 600 }}>Sort by:</span>
              <select
                value={sortBy}
                disabled={!authed}
                onChange={(e) => {
                  if (authed) setSortBy(e.target.value);
                  else setShowAuthGateModal(true);
                }}
                style={{
                  height: 44,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 13,
                  fontWeight: 600,
                  background: !authed ? '#f3f4f6' : C.bg,
                  color: !authed ? C.textMuted : C.text,
                  cursor: !authed ? 'not-allowed' : 'pointer',
                  outline: 'none',
                }}
              >
                <option value="name-asc">Name (A – Z)</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map((cat) => {
              const active = authed && selectedCategory === cat;
              return (
                <button
                  key={cat}
                  className="cat-chip"
                  onClick={() => {
                    if (!authed) {
                      setShowAuthGateModal(true);
                    } else {
                      setSelectedCategory(cat);
                    }
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    background: active ? C.g800 : C.surface,
                    color: active ? '#fff' : !authed ? C.textMuted : C.textSecondary,
                    border: `1px solid ${active ? C.g800 : C.border}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {!authed && cat !== 'All' && <span style={{ fontSize: 11 }}>🔒</span>}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── State Handlers: Loading / Error / Empty ──────────────── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textSecondary }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: `3px solid ${C.g100}`,
                borderTopColor: C.primaryDark,
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin .8s linear infinite',
              }}
            />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Loading commodity prices...</p>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '20px',
              borderRadius: 16,
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#991b1b',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Failed to load price records</p>
            <p style={{ fontSize: 13, margin: '0 0 16px' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#991b1b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {authed && !loading && !error && filteredPrices.length === 0 && (
          <div
            style={{
              background: C.surface,
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              border: `1px solid ${C.border}`,
            }}
          >
            <p style={{ fontSize: 32, margin: '0 0 12px' }}>🔍</p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>
              No commodities matched your search
            </h3>
            <p style={{ fontSize: 14, color: C.textSecondary, margin: '0 0 16px' }}>
              Try searching with different keywords or switch category filter to "All".
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
              style={{
                background: C.primaryDark,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear Search & Filters
            </button>
          </div>
        )}

        {/* ── Commodity Grid (Full list if authed, Sneak Peek if guest) ── */}
        {!loading && !error && displayedPrices.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {displayedPrices.map((item, idx) => {
              const name = item.commodity_name || item.product || 'Commodity';
              const pricePrevailing = Number(item.price_prevailing ?? item.price_average ?? 0);
              const priceLow = Number(item.price_low ?? pricePrevailing);
              const priceHigh = Number(item.price_high ?? pricePrevailing);
              const unit = item.unit || 'kg';
              const emoji = getEmoji(name, item.category);

              return (
                <div
                  key={idx}
                  className="comm-card"
                  style={{
                    background: C.surface,
                    borderRadius: 16,
                    border: `1px solid ${C.border}`,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  <div>
                    {/* Top row: category & emoji */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: C.g700,
                          background: C.g50,
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: `1px solid ${C.g100}`,
                        }}
                      >
                        {item.category || 'Agricultural'}
                      </span>
                      <span style={{ fontSize: 24 }}>{emoji}</span>
                    </div>

                    {/* Commodity Title */}
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: '0 0 4px', lineHeight: 1.25 }}>
                      {name}
                    </h3>

                    {/* Specification / note */}
                    {item.specification ? (
                      <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 14px', lineHeight: 1.4 }}>
                        {item.specification}
                      </p>
                    ) : (
                      <div style={{ height: 14, marginBottom: 14 }} />
                    )}

                    {/* Prevailing price */}
                    <div
                      style={{
                        background: C.g50,
                        borderRadius: 12,
                        padding: '12px 14px',
                        border: `1px solid ${C.g100}`,
                        marginBottom: 12,
                      }}
                    >
                      <p style={{ fontSize: 11, fontWeight: 700, color: C.g700, textTransform: 'uppercase', margin: '0 0 2px', letterSpacing: '.05em' }}>
                        Prevailing Price
                      </p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: C.g800 }}>₱</span>
                        <span style={{ fontSize: 26, fontWeight: 800, color: C.g800, lineHeight: 1 }}>
                          {pricePrevailing.toFixed(2)}
                        </span>
                        <span style={{ fontSize: 12, color: C.textSecondary }}>/ {unit}</span>
                      </div>

                      {/* Range */}
                      <p style={{ fontSize: 11, color: C.textSecondary, margin: '6px 0 0', fontWeight: 500 }}>
                        Range: ₱{priceLow.toFixed(2)} – ₱{priceHigh.toFixed(2)} / {unit}
                      </p>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => handleReportItem(item)}
                      title="Report price discrepancy for this item"
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        background: '#fff',
                        color: C.textSecondary,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                      </svg>
                      Report Concern
                    </button>

                    <button
                      onClick={() => navigate('/scanner')}
                      title="Scan this item with camera"
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: 'none',
                        background: C.primaryDark,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" fill="#fff" />
                      </svg>
                      Scan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Sneak Peek Lock Banner & Teaser below cards ─────────── */}
        {!authed && !loading && !error && lockedCount > 0 && (
          <div
            style={{
              marginTop: 28,
              background: `linear-gradient(135deg, ${C.g800} 0%, ${C.primaryDark} 100%)`,
              borderRadius: 20,
              padding: '32px 24px',
              color: '#fff',
              textAlign: 'center',
              boxShadow: '0 12px 30px rgba(22, 101, 52, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              animation: 'fadeUp .3s ease',
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 26,
              }}
            >
              🔒
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>
              +{lockedCount} More Commodities Locked
            </h3>

            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.55 }}>
              You are currently viewing a sneak peek of {SNEAK_PEEK_LIMIT} commodities. Full search and access to all {prices.length} monitored commodities are exclusive to registered actual users.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/user/signup?redirect=/commodities')}
                style={{
                  background: '#fff',
                  color: C.g800,
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }}
              >
                Sign Up to Unlock Full Search
              </button>

              <button
                onClick={() => navigate('/user/login?redirect=/commodities')}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  borderRadius: 12,
                  padding: '12px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn .15s ease',
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface,
              borderRadius: 20,
              padding: '32px 28px',
              width: '100%',
              maxWidth: 380,
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
              border: `1px solid ${C.border}`,
              animation: 'fadeUp .18s ease',
            }}
          >
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              margin: '0 auto 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.g900, margin: '0 0 8px' }}>Sign Out?</h3>
            <p style={{ fontSize: 14, color: C.textSecondary, margin: '0 0 24px', lineHeight: 1.5 }}>
              Are you sure you want to sign out of your Alescan account?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  background: C.surface,
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.textSecondary,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#dc2626',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auth Gate Modal for Search & Filtering ───────────────── */}
      {showAuthGateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn .2s ease',
          }}
          onClick={() => setShowAuthGateModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: 440,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              animation: 'fadeUp .25s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header banner */}
            <div
              style={{
                background: `linear-gradient(135deg, ${C.g800} 0%, ${C.primaryDark} 100%)`,
                padding: '24px 24px 20px',
                color: '#fff',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
                🔒 Members Only Feature
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: '#fff', lineHeight: 1.25 }}>
                Full Commodity Search
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
                Unauthenticated guests can view a sneak peek of the commodity list. Sign up as an actual user to unlock full search and filtering.
              </p>
            </div>

            {/* Benefits list */}
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
                Benefits for Registered Users:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bg, padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 18 }}>🔍</span>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Full Search Across All Commodities</h4>
                    <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>Search by keyword, category, and specifications.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bg, padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>More Scanning Tries</h4>
                    <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>Extended camera scans without the 5-scan trial lock.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bg, padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 18 }}>📢</span>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Report Overpriced Vendors</h4>
                    <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>File price concern tickets directly to Market Officers.</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => navigate('/user/signup?redirect=/commodities')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: C.primaryDark,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                  }}
                >
                  Sign Up for Free
                </button>

                <button
                  onClick={() => navigate('/user/login?redirect=/commodities')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 12,
                    border: `1.5px solid ${C.border}`,
                    background: '#fff',
                    color: C.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign In to Existing Account
                </button>

                <button
                  onClick={() => setShowAuthGateModal(false)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: C.textMuted,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Continue Browsing Sneak Peek
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
