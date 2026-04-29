import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from './Toast';

const DEMO_FEATURES = [
  { icon: '👥', label: '25 prospects', sub: 'Enterprise, mid-market & SMB across US, EU, APAC · enriched with titles, tech stacks, phones' },
  { icon: '✉️', label: '3 sequences',  sub: 'Q2 Enterprise Outbound (6 steps) · SMB Cold Outreach (4 steps) · Inbound Trial Follow-Up (3 steps)' },
  { icon: '📊', label: 'Live pipeline', sub: 'Meetings booked, replies, active enrollments, paused, opted-out — realistic spread of statuses' },
  { icon: '📧', label: 'Email history', sub: 'Sent, opened & failed emails with timestamps — visible in each sequence\'s Emails tab' },
  { icon: '📞', label: 'Call log',      sub: 'Connected, voicemail, no-answer & a planned call due today — visible in the Calls tab' },
  { icon: '⚡', label: 'Task inbox',    sub: 'Several due tasks across sequences so the Task Inbox has items ready to action' },
];

export default function DemoMode({ onClose, onLoaded }) {
  const toast = useToast();
  const [phase, setPhase] = useState('idle'); // idle | loading | done | clearing | confirm_clear

  const loadDemo = async () => {
    setPhase('loading');
    try {
      const res = await api.post('/demo/load');
      const s = res.data.summary;
      setPhase('done');
      toast(`Demo loaded — ${s.prospects} prospects, ${s.sequences} sequences, ${s.emailActivities + s.callActivities} activity records`, 'success', 5000);
      onLoaded?.();
    } catch (err) {
      setPhase('idle');
      toast(err.response?.data?.message || 'Failed to load demo data', 'error');
    }
  };

  const clearDemo = async () => {
    setPhase('clearing');
    try {
      await api.delete('/demo/clear');
      setPhase('idle');
      toast('Demo data cleared — app is ready for real data', 'info', 3000);
      onLoaded?.();
      onClose();
    } catch (err) {
      setPhase('idle');
      toast('Failed to clear demo data', 'error');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: '1.2rem' }}>🎬</span>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Demo Mode</h2>
              <span style={{
                fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '2px 7px', borderRadius: 'var(--radius-full)',
                background: 'var(--accent-dim)', color: 'var(--accent-secondary)', border: '1px solid var(--border-accent)',
              }}>
                One click
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Instantly populate the app with a full, realistic sales dataset — prospects, sequences, emails, calls, and pipeline activity. Perfect for walkthroughs and demos.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', flexShrink: 0, padding: '2px 4px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Feature list */}
        <div style={{ padding: '16px 24px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            What gets loaded
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEMO_FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', width: 24, textAlign: 'center', flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                <div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.label}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: 8 }}>{f.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--status-warning-dim)', border: '1px solid var(--status-warning-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--status-warning)', lineHeight: 1.5 }}>
            ⚠ Loading demo data will <strong>replace all existing prospects, sequences and activity records</strong>. This cannot be undone.
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
          {phase === 'idle' && (
            <>
              <button
                onClick={loadDemo}
                style={{ flex: 1, fontWeight: 700, fontSize: '0.92rem', padding: '10px 0', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              >
                Load Demo Data
              </button>
              <button
                onClick={() => setPhase('confirm_clear')}
                className="ghost"
                style={{ fontSize: '0.82rem', padding: '10px 16px', color: 'var(--text-muted)' }}
              >
                Clear all data
              </button>
            </>
          )}

          {phase === 'loading' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Building demo dataset — creating prospects, sequences &amp; activity records…
              </span>
            </div>
          )}

          {phase === 'done' && (
            <>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>✅</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--status-success)' }}>
                  Demo data loaded successfully!
                </span>
              </div>
              <button onClick={onClose} style={{ fontSize: '0.84rem', padding: '8px 18px', fontWeight: 600, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                Explore →
              </button>
              <button onClick={() => setPhase('confirm_clear')} className="ghost" style={{ fontSize: '0.78rem', padding: '8px 12px', color: 'var(--text-muted)' }}>
                Clear
              </button>
            </>
          )}

          {phase === 'confirm_clear' && (
            <>
              <span style={{ flex: 1, fontSize: '0.84rem', color: 'var(--status-danger)', fontWeight: 600 }}>
                Delete all prospects, sequences &amp; activities?
              </span>
              <button
                onClick={clearDemo}
                style={{ fontSize: '0.82rem', padding: '8px 14px', background: 'var(--status-danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
              >
                Yes, clear all
              </button>
              <button onClick={() => setPhase('idle')} className="ghost" style={{ fontSize: '0.78rem', padding: '8px 12px', color: 'var(--text-muted)' }}>
                Cancel
              </button>
            </>
          )}

          {phase === 'clearing' && (
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Clearing all data…</span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
