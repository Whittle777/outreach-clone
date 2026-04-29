import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}

const TYPE_CONFIG = {
  success: { icon: '✓', color: 'var(--status-success)', bg: 'var(--status-success-soft)',  border: 'var(--status-success-border)' },
  error:   { icon: '✕', color: 'var(--status-danger)',  bg: 'var(--status-danger-soft)',   border: 'var(--status-danger-border)' },
  info:    { icon: 'ℹ', color: 'var(--status-info)',    bg: 'var(--status-info-soft)',     border: 'var(--status-info-border)' },
  warning: { icon: '!', color: 'var(--status-warning)', bg: 'var(--status-warning-soft)',  border: 'var(--status-warning-border)' },
};

function ToastItem({ t, onDismiss }) {
  const cfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.info;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-md)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
      fontSize: '0.855rem',
      color: 'var(--text-primary)',
      minWidth: 220,
      maxWidth: 380,
      animation: 'toastSlideIn 0.18s ease',
    }}>
      <span style={{ color: cfg.color, fontWeight: 800, fontSize: '0.85rem', flexShrink: 0, lineHeight: 1 }}>
        {cfg.icon}
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
      <button
        onClick={() => onDismiss(t.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '0.8rem',
          padding: '0 2px', lineHeight: 1, flexShrink: 0,
          opacity: 0.7,
        }}
        aria-label="Dismiss"
      >✕</button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success', duration = 3200) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: toasts.length ? 'auto' : 'none',
        }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} t={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
