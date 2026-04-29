import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Wraps children with a disabled overlay + tooltip when `show` is true.
 * On hover, a tooltip appears explaining what needs to be configured,
 * with an optional "Go to Integrations →" link.
 *
 * Usage:
 *   <SetupTooltip show={!isConfigured('microsoft')} message="Requires Microsoft 365 integration">
 *     <button>Dial</button>
 *   </SetupTooltip>
 */
export default function SetupTooltip({ show, message, children }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  if (!show) return children;

  const handleMove = (e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMove}
    >
      {/* Dimmed, non-interactive clone of children */}
      <div style={{ opacity: 0.38, pointerEvents: 'none', filter: 'grayscale(0.4)', userSelect: 'none' }}>
        {children}
      </div>

      {/* Transparent click-catcher covering the children */}
      <div style={{ position: 'absolute', inset: 0, cursor: 'not-allowed', zIndex: 1 }} />

      {/* Tooltip */}
      {visible && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(pos.x, 200),
            top: pos.y + 14,
            zIndex: 200,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            minWidth: 220,
            maxWidth: 280,
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
            Not configured
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {message}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.73rem', color: 'var(--accent-light)', fontWeight: 600 }}>
            Go to Integrations to set this up →
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Full-width block variant — wraps a block-level element (e.g. a full-width button).
 */
export function SetupTooltipBlock({ show, message, children }) {
  const [visible, setVisible] = useState(false);

  if (!show) return children;

  return (
    <div
      style={{ position: 'relative', width: '100%' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <div style={{ opacity: 0.38, pointerEvents: 'none', filter: 'grayscale(0.4)', userSelect: 'none', width: '100%' }}>
        {children}
      </div>
      <div style={{ position: 'absolute', inset: 0, cursor: 'not-allowed', zIndex: 1 }} />
      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            minWidth: 230,
            maxWidth: 300,
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
            Not configured
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {message}
          </div>
          <div style={{ marginTop: 8, fontSize: '0.73rem', color: 'var(--accent-light)', fontWeight: 600 }}>
            Go to Integrations to set this up →
          </div>
        </div>
      )}
    </div>
  );
}
