// ─── Shared design-system constants ──────────────────────────────────────────
// Single source of truth for token-mapped style objects used across multiple
// components. Import what you need — don't copy-paste these inline.

export const STEP_TYPE_CONFIG = {
  AUTO_EMAIL:   { icon: '✉️', label: 'Auto Email',   color: 'var(--accent-primary)',   bg: 'var(--accent-dim)',          border: 'var(--border-accent)' },
  MANUAL_EMAIL: { icon: '📧', label: 'Manual Email', color: 'var(--status-info)',      bg: 'var(--status-info-dim)',     border: 'var(--status-info-border)' },
  CALL:         { icon: '📞', label: 'Call',         color: 'var(--status-success)',   bg: 'var(--status-success-dim)',  border: 'var(--status-success-border)' },
  LINKEDIN:     { icon: '💼', label: 'LinkedIn',     color: 'var(--accent-secondary)', bg: 'rgba(99,102,241,0.12)',     border: 'rgba(99,102,241,0.28)' },
  TASK:         { icon: '✅', label: 'Task',         color: 'var(--status-warning)',   bg: 'var(--status-warning-dim)', border: 'var(--status-warning-border)' },
};

export const ENROLLMENT_STATUS_STYLES = {
  active:    { color: 'var(--status-info)',    bg: 'var(--status-info-dim)',     border: 'var(--status-info-border)' },
  paused:    { color: 'var(--status-warning)', bg: 'var(--status-warning-dim)', border: 'var(--status-warning-border)' },
  completed: { color: 'var(--status-success)', bg: 'var(--status-success-dim)', border: 'var(--status-success-border)' },
  opted_out: { color: 'var(--text-muted)',     bg: 'rgba(100,116,139,0.08)',    border: 'rgba(100,116,139,0.18)' },
  replied:   { color: 'var(--status-success)', bg: 'var(--status-success-dim)', border: 'var(--status-success-border)' },
  bounced:   { color: 'var(--status-danger)',  bg: 'var(--status-danger-dim)',  border: 'var(--status-danger-border)' },
  failed:    { color: 'var(--status-danger)',  bg: 'var(--status-danger-dim)',  border: 'var(--status-danger-border)' },
};

export const PROSPECT_STATUS_STYLES = {
  'Uncontacted':    { bg: 'var(--accent-dim)',          color: 'var(--accent-secondary)', border: 'var(--border-accent)' },
  'In Sequence':    { bg: 'var(--status-info-dim)',     color: 'var(--status-info)',      border: 'var(--status-info-border)' },
  'Meeting Booked': { bg: 'var(--status-success-dim)', color: 'var(--status-success)',   border: 'var(--status-success-border)' },
  'Not Interested': { bg: 'rgba(100,116,139,0.08)',    color: 'var(--text-muted)',       border: 'rgba(100,116,139,0.18)' },
  'Replied':        { bg: 'var(--status-warning-dim)', color: 'var(--status-warning)',   border: 'var(--status-warning-border)' },
};
