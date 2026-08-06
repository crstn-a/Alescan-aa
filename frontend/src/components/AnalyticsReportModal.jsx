import React from 'react';

const C = {
  g900: '#064e3b',
  g800: '#065f46',
  g700: '#047857',
  g600: '#059669',
  g50: '#ecfdf5',
  g100: '#d1fae5',
  k900: '#111827',
  k800: '#1f2937',
  k700: '#374151',
  k500: '#6b7280',
  k400: '#9ca3af',
  k200: '#e5e7eb',
  k100: '#f3f4f6',
  k50: '#f9fafb',
  white: '#ffffff',
  a700: '#d97706',
  a50: '#fffbeb',
  r600: '#dc2626',
  r50: '#fef2f2',
};

export default function AnalyticsReportModal({ data, user, onClose }) {
  const generatedAt = new Date();
  const dateStr = generatedAt.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = generatedAt.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const reportId = `REP-${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(2, '0')}${String(generatedAt.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const totalScans = data?.scans?.total_scans || 0;
  const detectionSplit = data?.scans?.detection_split || [];
  const highConfObj = detectionSplit.find(d => d.name === 'High Confidence');
  const highConfPct = highConfObj ? highConfObj.value : 0;
  
  const commodityPerf = data?.scans?.commodity_performance || [];
  const latestModel = data?.models?.[data.models.length - 1] || {};
  const pricesData = data?.prices || [];

  // Extract latest prices from price records
  const latestPrices = [];
  if (pricesData.length > 0) {
    const lastEntry = pricesData[pricesData.length - 1];
    Object.keys(lastEntry).forEach(key => {
      if (key !== 'date') {
        latestPrices.push({
          name: key,
          price: lastEntry[key],
          date: lastEntry.date
        });
      }
    });
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .modal-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            overflow: visible !important;
            inset: auto !important;
          }
          .modal-content {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .report-header {
            border-bottom: 2px solid #065f46 !important;
          }
        }
      `}</style>

      <div
        className="modal-content"
        style={{
          background: C.white,
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `1px solid ${C.k200}`,
        }}
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${C.k100}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: C.k50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.g50,
                color: C.g700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              📄
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.k900 }}>
                Analytics Report Preview
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: C.k500 }}>
                Ready to save as PDF or send to printer
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                background: C.g800,
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(6, 95, 70, 0.25)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.g700)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.g800)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print / Save as PDF
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: `1px solid ${C.k200}`,
                background: C.white,
                color: C.k700,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.k100)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '36px 40px', background: C.white }}>
          
          {/* Header */}
          <div
            className="report-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: 24,
              borderBottom: `2px solid ${C.g800}`,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src="/Alescan-Logo.png"
                alt="Alescan Logo"
                style={{ width: 52, height: 52, objectFit: 'contain' }}
              />
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.g900, letterSpacing: '-0.02em' }}>
                  ALESCAN
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: C.g700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Automated Price Scanning & Analytics System
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: C.k500 }}>
                  Official Operational & Commodity Analytics Report
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: 12, color: C.k700, lineHeight: 1.6 }}>
              <div><strong style={{ color: C.k900 }}>Report ID:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{reportId}</span></div>
              <div><strong>Generated:</strong> {dateStr} at {timeStr}</div>
              <div><strong>Prepared By:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 700, color: C.g800 }}>{user || 'ADMIN'}</span></div>
            </div>
          </div>

          {/* Section 1: Executive KPI Summary */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: C.k900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, background: C.g700, borderRadius: 2 }}></span>
              Executive Summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <div style={{ background: C.k50, padding: 14, borderRadius: 12, border: `1px solid ${C.k200}` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.k500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Scans</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.k900, marginTop: 4 }}>{totalScans.toLocaleString()}</div>
                <span style={{ fontSize: 11, color: C.g700, fontWeight: 500 }}>Verified Logged Scans</span>
              </div>
              <div style={{ background: C.g50, padding: 14, borderRadius: 12, border: `1px solid ${C.g100}` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.g800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>High Confidence</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.g700, marginTop: 4 }}>{highConfPct}%</div>
                <span style={{ fontSize: 11, color: C.g700, fontWeight: 500 }}>Detection Rate</span>
              </div>
              <div style={{ background: C.a50, padding: 14, borderRadius: 12, border: `1px solid #fde68a` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.a700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Model Accuracy</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.a700, marginTop: 4 }}>
                  {latestModel.accuracy ? `${(latestModel.accuracy * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <span style={{ fontSize: 11, color: C.a700, fontWeight: 500 }}>Version: {latestModel.model_version || 'Latest'}</span>
              </div>
              <div style={{ background: C.k50, padding: 14, borderRadius: 12, border: `1px solid ${C.k200}` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.k500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Tracked Commodities</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.k900, marginTop: 4 }}>{commodityPerf.length}</div>
                <span style={{ fontSize: 11, color: C.k500, fontWeight: 500 }}>Active Categories</span>
              </div>
            </div>
          </div>

          {/* Section 2: Latest Commodity Prices */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: C.k900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, background: C.g700, borderRadius: 2 }}></span>
              Commodity Price Monitoring
            </h2>
            {latestPrices.length === 0 ? (
              <p style={{ fontSize: 12, color: C.k500, fontStyle: 'italic' }}>No price records available.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textIndent: 0 }}>
                <thead>
                  <tr style={{ background: C.k100, borderBottom: `2px solid ${C.k200}` }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: C.k800 }}>Commodity Name</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: C.k800 }}>Latest Price / kg</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: C.k800 }}>Record Date</th>
                  </tr>
                </thead>
                <tbody>
                  {latestPrices.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.k200}`, background: idx % 2 === 0 ? C.white : C.k50 }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: C.k900 }}>{item.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: C.g700 }}>₱{Number(item.price).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: C.k500, fontSize: 12 }}>{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 3: Detection Performance & Breakdown */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: C.k900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, background: C.g700, borderRadius: 2 }}></span>
              Detection Performance Breakdown
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.k100, borderBottom: `2px solid ${C.k200}` }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: C.k800 }}>Commodity</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: C.k800 }}>Total Scans</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: C.g700 }}>Success</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: C.a700 }}>Low Conf.</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: C.r600 }}>Failed</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: C.k800 }}>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {commodityPerf.map((row, idx) => {
                  const rate = row.total > 0 ? ((row.Success / row.total) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${C.k200}`, background: idx % 2 === 0 ? C.white : C.k50 }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: C.k900 }}>{row.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: C.k700 }}>{row.total}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: C.g700 }}>{row.Success}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: C.a700 }}>{row['Low Confidence']}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: C.r600 }}>{row.Failed}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: rate >= 80 ? C.g700 : C.a700 }}>
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 4: AI Model Evaluation Summary */}
          {latestModel.model_version && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: C.k900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 4, height: 16, background: C.g700, borderRadius: 2 }}></span>
                AI Model Metrics ({latestModel.model_version})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, textAlign: 'center' }}>
                <div style={{ padding: 10, background: C.k50, borderRadius: 8, border: `1px solid ${C.k200}` }}>
                  <div style={{ fontSize: 11, color: C.k500, fontWeight: 600 }}>Accuracy</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.g700, marginTop: 2 }}>{((latestModel.accuracy || 0) * 100).toFixed(1)}%</div>
                </div>
                <div style={{ padding: 10, background: C.k50, borderRadius: 8, border: `1px solid ${C.k200}` }}>
                  <div style={{ fontSize: 11, color: C.k500, fontWeight: 600 }}>Precision</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#8b5cf6', marginTop: 2 }}>{((latestModel.precision || 0) * 100).toFixed(1)}%</div>
                </div>
                <div style={{ padding: 10, background: C.k50, borderRadius: 8, border: `1px solid ${C.k200}` }}>
                  <div style={{ fontSize: 11, color: C.k500, fontWeight: 600 }}>Recall</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0891b2', marginTop: 2 }}>{((latestModel.recall || 0) * 100).toFixed(1)}%</div>
                </div>
                <div style={{ padding: 10, background: C.k50, borderRadius: 8, border: `1px solid ${C.k200}` }}>
                  <div style={{ fontSize: 11, color: C.k500, fontWeight: 600 }}>F1 Score</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.a700, marginTop: 2 }}>{((latestModel.f1_score || 0) * 100).toFixed(1)}%</div>
                </div>
                <div style={{ padding: 10, background: C.k50, borderRadius: 8, border: `1px solid ${C.k200}` }}>
                  <div style={{ fontSize: 11, color: C.k500, fontWeight: 600 }}>Avg Confidence</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.r600, marginTop: 2 }}>{((latestModel.avg_confidence || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Official Certification Sign-Off Block */}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px dashed ${C.k200}`, pageBreakInside: 'avoid' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.k500, textTransform: 'uppercase', marginBottom: 40 }}>
                  Prepared By (Administrator):
                </p>
                <div style={{ borderBottom: `1px solid ${C.k900}`, width: 220, marginBottom: 4 }}></div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.k900, margin: 0, textTransform: 'uppercase' }}>
                  {user || 'ADMIN USER'}
                </p>
                <p style={{ fontSize: 11, color: C.k500, margin: 0 }}>System Administrator / Data Analyst</p>
              </div>

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.k500, textTransform: 'uppercase', marginBottom: 40 }}>
                  Verified & Approved By:
                </p>
                <div style={{ borderBottom: `1px solid ${C.k900}`, width: 220, marginBottom: 4 }}></div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.k900, margin: 0 }}>
                  MARKET MONITORING AUTHORITY
                </p>
                <p style={{ fontSize: 11, color: C.k500, margin: 0 }}>Date: ________________________</p>
              </div>
            </div>

            <div style={{ marginTop: 30, textAlign: 'center', fontSize: 10, color: C.k400 }}>
              This document was automatically generated by ALESCAN System Engine on {dateStr}. Confirmed valid without manual edits.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
