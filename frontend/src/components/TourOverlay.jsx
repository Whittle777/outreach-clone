import React, { useState, useEffect, useRef, useCallback } from 'react';

const LS_KEY = 'tour_completed_v1';

// ─── Tour step definitions ────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to Apex',
    body: "This 2-minute tour covers everything you'll use every day as a BDR or SDR — from importing prospects to dialling and managing your sequences.",
    cta: 'Start tour →',
    position: 'center',
  },
  {
    id: 'integrations',
    target: '[data-tour="nav-integrations"]',
    title: '1 of 6 — Connect your tools first',
    body: "Before anything else, visit Integrations and connect Claude AI, Google Workspace, and Microsoft 365. Until they're connected, certain buttons will be greyed out with a tooltip explaining what's needed.",
    position: 'right',
  },
  {
    id: 'dashboard',
    target: '[data-tour="nav-dashboard"]',
    title: '2 of 6 — Command Center',
    body: "Start every morning here. Ask the AI to build a call list, check how many prospects haven't been contacted yet, and review your pipeline at a glance. Try: \"Build a call list of uncontacted prospects with a phone number\".",
    position: 'right',
  },
  {
    id: 'prospects',
    target: '[data-tour="nav-prospects"]',
    title: '3 of 6 — Prospects',
    body: 'Your full contact database. Import via CSV or add one at a time. Click any row to open a detail panel with notes, sequence status, call history, and quick actions. Use the Engagement score to prioritise who to contact first.',
    position: 'right',
  },
  {
    id: 'sequences',
    target: '[data-tour="nav-sequences"]',
    title: '4 of 6 — Sequences',
    body: 'Build multi-step email cadences. Each step can be an email, call reminder, or LinkedIn touch. Enrol prospects individually or in bulk — they\'ll move through the steps automatically. Use {{firstName}} and {{company}} to personalise.',
    position: 'right',
  },
  {
    id: 'tasks',
    target: '[data-tour="nav-tasks"]',
    title: '5 of 6 — Task Inbox',
    body: "Check this every morning — it's your daily to-do list. It pulls every due email, call, and touch from all your active sequences, sorted by urgency. Overdue items appear at the top in red.",
    position: 'right',
  },
  {
    id: 'dialer',
    target: '[data-tour="nav-dialer"]',
    title: '6 of 6 — Calls',
    body: 'Load a call list (build one in Command Center or pick from Prospects), then choose your mode. Manual gives you full control. Sequential auto-advances and can drop voicemails. Power dials multiple lines at once and connects you only when someone picks up.',
    position: 'right',
  },
  {
    id: 'done',
    target: null,
    title: "You're ready to start selling!",
    body: "The daily workflow: check Task Inbox → work your call sessions → manage sequences → build new lists in Command Center. Come back to this tour any time via the ? button in the sidebar.",
    cta: 'Get started',
    position: 'center',
  },
];

// ─── Callout arrow ────────────────────────────────────────────────────────────
const ARROW_SIZE = 8;

function arrowStyle(position) {
  const base = {
    position: 'absolute',
    width: 0, height: 0,
    borderStyle: 'solid',
  };
  switch (position) {
    case 'right': // callout is to the right → arrow points left
      return {
        ...base,
        left: -ARROW_SIZE,
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: `${ARROW_SIZE}px ${ARROW_SIZE}px ${ARROW_SIZE}px 0`,
        borderColor: `transparent var(--bg-elevated) transparent transparent`,
      };
    case 'left':
      return {
        ...base,
        right: -ARROW_SIZE,
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: `${ARROW_SIZE}px 0 ${ARROW_SIZE}px ${ARROW_SIZE}px`,
        borderColor: `transparent transparent transparent var(--bg-elevated)`,
      };
    case 'bottom':
      return {
        ...base,
        top: -ARROW_SIZE,
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: `0 ${ARROW_SIZE}px ${ARROW_SIZE}px ${ARROW_SIZE}px`,
        borderColor: `transparent transparent var(--bg-elevated) transparent`,
      };
    default:
      return {};
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TourOverlay({ onClose }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const calloutRef = useRef(null);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  // Find and measure the target element
  const measureTarget = useCallback(() => {
    if (!current.target) { setTargetRect(null); return; }
    const el = document.querySelector(current.target);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({
      top: r.top + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width,
      height: r.height,
      right: r.right,
      bottom: r.bottom,
    });
  }, [step, current.target]);

  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    return () => window.removeEventListener('resize', measureTarget);
  }, [measureTarget]);

  // Keyboard navigation
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') advance();
      if (e.key === 'ArrowLeft') back();
      if (e.key === 'Escape') finish();
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [step]);

  function advance() {
    if (isLast) { finish(); return; }
    setStep(s => s + 1);
  }

  function back() {
    if (!isFirst) setStep(s => s - 1);
  }

  function finish() {
    localStorage.setItem(LS_KEY, '1');
    onClose();
  }

  // ── Callout position ───────────────────────────────────────────────────────
  const CALLOUT_W = 320;
  const CALLOUT_GAP = 18;

  let calloutStyle = {};
  let arrowPos = null;

  if (!targetRect || current.position === 'center') {
    // Centered modal
    calloutStyle = {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  } else {
    // Anchored to target
    const viewW = window.innerWidth;
    const spaceRight = viewW - targetRect.right;
    const spaceLeft  = targetRect.left;

    if (spaceRight >= CALLOUT_W + CALLOUT_GAP) {
      // Place to the right
      calloutStyle = {
        position: 'fixed',
        left: targetRect.right + CALLOUT_GAP,
        top: Math.max(16, Math.min(
          targetRect.top + targetRect.height / 2 - 80,
          window.innerHeight - 240
        )),
      };
      arrowPos = 'right';
    } else if (spaceLeft >= CALLOUT_W + CALLOUT_GAP) {
      // Place to the left
      calloutStyle = {
        position: 'fixed',
        right: viewW - targetRect.left + CALLOUT_GAP,
        top: Math.max(16, Math.min(
          targetRect.top + targetRect.height / 2 - 80,
          window.innerHeight - 240
        )),
      };
      arrowPos = 'left';
    } else {
      // Fallback: below
      calloutStyle = {
        position: 'fixed',
        left: Math.max(16, targetRect.left),
        top: targetRect.bottom + CALLOUT_GAP,
      };
      arrowPos = 'bottom';
    }
  }

  // ── Highlight box (punch-out) ──────────────────────────────────────────────
  const PAD = 6;
  const highlightStyle = targetRect ? {
    position: 'fixed',
    top:    targetRect.top    - PAD - window.scrollY,
    left:   targetRect.left   - PAD - window.scrollX,
    width:  targetRect.width  + PAD * 2,
    height: targetRect.height + PAD * 2,
    borderRadius: 8,
    boxShadow: `0 0 0 2px var(--accent-primary), 0 0 0 9999px rgba(0,0,0,0.72)`,
    zIndex: 1001,
    pointerEvents: 'none',
    transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
  } : null;

  return (
    <>
      {/* Dark backdrop — only rendered when no targetRect (centered steps) */}
      {!targetRect && (
        <div
          onClick={finish}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* Spotlight highlight ring */}
      {highlightStyle && <div style={highlightStyle} />}

      {/* Callout card */}
      <div
        ref={calloutRef}
        style={{
          ...calloutStyle,
          zIndex: 1002,
          width: CALLOUT_W,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'fadeInUp 0.18s ease',
        }}
      >
        {/* Arrow */}
        {arrowPos && <div style={arrowStyle(arrowPos)} />}

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              style={{
                width: i === step ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === step ? 'var(--accent-primary)' : i < step ? 'var(--accent-dim)' : 'var(--border-color)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Content */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>
            {current.title}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {current.body}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {!isFirst && (
            <button
              onClick={back}
              className="ghost"
              style={{ padding: '7px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={advance}
            style={{ flex: 1, padding: '9px 16px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            {current.cta || (isLast ? 'Done' : 'Next →')}
          </button>
          {!isLast && (
            <button
              onClick={finish}
              className="ghost"
              style={{ padding: '7px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}
            >
              Skip
            </button>
          )}
        </div>

        {/* Keyboard hint — only on first step */}
        {isFirst && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Use ← → arrow keys to navigate
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// ── Hook: auto-show on first visit ────────────────────────────────────────────
export function useTourAutoStart() {
  return !localStorage.getItem(LS_KEY);
}

export { LS_KEY as TOUR_LS_KEY };
