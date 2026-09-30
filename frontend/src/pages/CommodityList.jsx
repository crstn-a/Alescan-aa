// frontend/src/pages/CommodityList.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllPrices } from '../api/scanApi';
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

  // Filter and sort items
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
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <img src="/Alescan-Logo.png" alt="Alescan" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.g900, letterSpacing: '.02em' }}>
                ALESCAN
              </span>
              <span style={{ display: 'block', fontSize: 11, color: C.textSecondary, fontWeight: 500, lineHeight: 1 }}>
                Commodity Price Directory
              </span>
            </div>
          </Link>

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
                    background: C.primaryDark,
                    color: '#fff',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Report Concern
                </Link>
                <div
                  style={{
                    background: C.g100,
                    borderRadius: 20,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.g800,
                  }}
                >
                  👤 {user?.first_name || 'Member'}
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
        {/* Banner if guest */}
        {!authed && (
          <div
            style={{
              background: `linear-gradient(135deg, ${C.g800} 0%, ${C.primaryDark} 100%)`,
              borderRadius: 18,
              padding: '24px 28px',
              color: '#fff',
              marginBottom: 24,
              boxShadow: '0 8px 24px rgba(22, 101, 52, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ maxWidth: 680 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '3px 10px', marginBottom: 8, fontSize: 11, fontWeight: 700 }}>
                ⭐ Member Benefit
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>
                Full Search & Overall Commodity Prices
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
                Registered users enjoy complete search access across all monitored agricultural commodities, more camera scan tries, and direct price reporting to Market Officers.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate('/user/signup?redirect=/commodities')}
                style={{
                  background: '#fff',
                  color: C.g800,
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                }}
              >
                Sign Up for Free
              </button>
              <button
                onClick={() => navigate('/user/login?redirect=/commodities')}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, background: C.surface, padding: '6px 14px', borderRadius: 12, border: `1px solid ${C.border}` }}>
            Showing <strong style={{ color: C.g800 }}>{filteredPrices.length}</strong> commodities
          </div>
        </div>

        {/* ── Search & Filter Controls ──────────────────────────── */}
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
          }}
        >
          {/* Search bar & Sort row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={C.textMuted}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Search commodities by name, category, or specification..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px 0 42px',
                  borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 14,
                  background: C.bg,
                  color: C.text,
                  transition: 'all .15s',
                }}
              />
              {search && (
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
              )}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: C.textSecondary, fontWeight: 600 }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  height: 44,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 13,
                  fontWeight: 600,
                  background: C.bg,
                  color: C.text,
                  cursor: 'pointer',
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
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  className="cat-chip"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    background: active ? C.g800 : C.surface,
                    color: active ? '#fff' : C.textSecondary,
                    border: `1px solid ${active ? C.g800 : C.border}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
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

        {!loading && !error && filteredPrices.length === 0 && (
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

        {/* ── Commodity Grid ──────────────────────────────────────── */}
        {!loading && !error && filteredPrices.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {filteredPrices.map((item, idx) => {
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
      </main>
    </div>
  );
}
