import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MOCK_FLAGS = [
  { id: 1, type: 'OBJECTION_DETECTED', prospect: 'Marcus Rivera', severity: 'high', time: '2m ago', callId: 'call-002' },
  { id: 2, type: 'LOW_CONFIDENCE_ACTION', prospect: 'Sarah Chen', severity: 'medium', time: '5m ago', callId: null },
  { id: 3, type: 'REVIEW_QUEUE_ITEM', prospect: 'Jessica Park', severity: 'low', time: '12m ago', callId: null },
];

const SEVERITY_COLORS = {
  high: 'var(--status-danger)',
  medium: 'var(--status-warning)',
  low: 'var(--status-info)',
};

const TYPE_LABELS = {
  OBJECTION_DETECTED: 'Objection Detected',
  LOW_CONFIDENCE_ACTION: 'Low Confidence — Review Required',
  REVIEW_QUEUE_ITEM: 'New Item in Review Queue',
};

const CallFlags = () => {
  const [flags, setFlags] = useState(MOCK_FLAGS);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(MOCK_FLAGS.filter(f => f.severity === 'high').length);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const pollRef = useRef(null);

  const fetchFlags = async () => {
    try {
      const res = await api.get('/hitl/flags');
      if (res.data) {
        setFlags(res.data);
        setUnreadCount(res.data.filter(f => f.severity === 'high').length);
      }
    } catch (err) {
      // Keep mock flags if backend unavailable
    }
  };

  useEffect(() => {
    fetchFlags();
    pollRef.current = setInterval(fetchFlags, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dismissFlag = (id, e) => {
    e.stopPropagation();
    const removed = flags.find(f => f.id === id);
    setFlags(prev => prev.filter(f => f.id !== id));
    if (removed?.severity === 'high') setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleFlagClick = (flag) => {
    setIsOpen(false);
    if (flag.callId) navigate('/voice-fleet');
    else navigate('/hitl');
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        className="secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative', padding: '5px 10px',
          borderColor: unreadCount > 0 ? 'var(--status-danger-border)' : undefined,
          fontSize: '1rem',
        }}
      >
        🚩
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6, width: 18, height: 18,
            backgroundColor: 'var(--status-danger)', borderRadius: '50%',
            fontSize: '0.65rem', fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-secondary)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320,
          backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-glass)', zIndex: 200
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Active Flags</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{flags.length} alerts</span>
          </div>

          {flags.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              ✓ No active flags
            </div>
          ) : (
            flags.map(flag => (
              <div
                key={flag.id}
                onClick={() => handleFlagClick(flag)}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  borderLeft: `3px solid ${SEVERITY_COLORS[flag.severity]}`
                }}
              >
                <span style={{ fontSize: '0.9rem', marginTop: 2 }}>
                  {flag.severity === 'high' ? '🔴' : flag.severity === 'medium' ? '🟡' : '🔵'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: SEVERITY_COLORS[flag.severity] }}>
                    {TYPE_LABELS[flag.type]}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {flag.prospect} · {flag.time}
                  </div>
                </div>
                <button
                  className="ghost"
                  onClick={(e) => dismissFlag(flag.id, e)}
                  style={{ color: 'var(--text-muted)', padding: '2px 6px', fontSize: '0.8rem', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            ))
          )}

          <div style={{ padding: '10px 16px' }}>
            <button
              className="secondary"
              onClick={() => { setIsOpen(false); navigate('/hitl'); }}
              style={{ width: '100%', fontSize: '0.82rem' }}
            >
              Open Full Review Queue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallFlags;
