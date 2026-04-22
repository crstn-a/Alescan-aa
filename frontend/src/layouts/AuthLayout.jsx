export default function AuthLayout({ left, right }) {
  return (
    <div className="auth-layout">
      <div className="auth-left">{left}</div>
      <div className="auth-right">{right}</div>

      <style>{`
        .auth-layout {
          display: grid;
          grid-template-columns: 1fr;
          width: 100vw;
          min-height: 100dvh;
        }

        /* Desktop split */
        @media (min-width: 1024px) {
          .auth-layout {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }

        /* Left panel */
        .auth-left {
          display: none;
        }

        @media (min-width: 1024px) {
          .auth-left {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: clamp(32px, 5vw, 80px);
          }
        }

        /* Right panel */
        .auth-right {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: clamp(16px, 4vw, 64px);
        }

        /* Mobile behavior */
        @media (max-width: 480px) {
          .auth-right {
            align-items: flex-start;
            padding-top: 48px;
          }
        }
      `}</style>
    </div>
  )
}