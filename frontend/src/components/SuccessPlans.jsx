import React, { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'success_plans_v1';

const DEAL_STAGES = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won'];

const TEMPLATES = ['MEDDPICC', 'BANT', 'SPIN Selling', 'Custom/Blank'];

const METHODOLOGY_MAP = {
  MEDDPICC: 'MEDDPICC',
  BANT: 'BANT',
  'SPIN Selling': 'SPIN',
  'Custom/Blank': 'Custom',
};

const STAGE_COLORS = {
  Prospecting:  { color: 'var(--text-muted)',     bg: 'rgba(100,116,139,0.12)',    border: 'rgba(100,116,139,0.22)' },
  Discovery:    { color: 'var(--status-info)',    bg: 'var(--status-info-dim)',    border: 'var(--status-info-border)' },
  Proposal:     { color: 'var(--accent-primary)', bg: 'var(--accent-dim)',         border: 'var(--border-accent)' },
  Negotiation:  { color: 'var(--status-warning)', bg: 'var(--status-warning-dim)', border: 'var(--status-warning-border)' },
  'Closed Won': { color: 'var(--status-success)', bg: 'var(--status-success-dim)', border: 'var(--status-success-border)' },
};

const HEALTH_COLORS = {
  green:  'var(--status-success)',
  yellow: 'var(--status-warning)',
  red:    'var(--status-danger)',
};

const TEMPLATE_MILESTONES = {
  MEDDPICC: {
    rep: ['Identify Metrics/ROI', 'Map Economic Buyer', 'Confirm Decision Criteria', 'Understand Decision Process', 'Identify Pain'],
    buyer: ['Share Org Chart', 'Confirm budget approval', 'Intro to Champion'],
  },
  BANT: {
    rep: ['Qualify Budget', 'Identify Authority', 'Confirm Need', 'Agree Timeline'],
    buyer: ['Share current vendor contract', 'Confirm internal sponsor'],
  },
  'SPIN Selling': {
    rep: ['Uncover Situation', 'Surface Problem Questions', 'Explore Implication', 'Present Need-Payoff'],
    buyer: ['Share current process documentation', 'Confirm pain owner'],
  },
  'Custom/Blank': {
    rep: [''],
    buyer: [],
  },
};

const MOCK_ACTIVITY = [
  { id: 1, text: 'Plan shared with buyer', time: '2 days ago' },
  { id: 2, text: 'Buyer viewed plan', time: '2 days ago' },
  { id: 3, text: 'Milestone completed: Identify Metrics/ROI', time: '3 days ago' },
  { id: 4, text: 'Plan created', time: '5 days ago' },
  { id: 5, text: 'Template applied: MEDDPICC', time: '5 days ago' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function computeHealth(milestones) {
  const overdueCount = milestones.filter(m => !m.done && isOverdue(m.dueDate)).length;
  if (overdueCount >= 3) return 'red';
  if (overdueCount >= 1) return 'yellow';
  return 'green';
}

function buildMilestones(template) {
  const tpl = TEMPLATE_MILESTONES[template] || TEMPLATE_MILESTONES['Custom/Blank'];
  const repTasks = tpl.rep.map(desc => ({
    id: genId(),
    description: desc,
    owner: 'Rep',
    dueDate: addDays(14),
    done: false,
  }));
  const buyerTasks = tpl.buyer.map(desc => ({
    id: genId(),
    description: desc,
    owner: 'Buyer',
    dueDate: addDays(21),
    done: false,
  }));
  return [...repTasks, ...buyerTasks];
}

function loadPlans() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function savePlans(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StageBadge({ stage }) {
  const s = STAGE_COLORS[stage] || STAGE_COLORS.Prospecting;
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {stage}
    </span>
  );
}

function HealthDot({ health, size = 10 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      background: HEALTH_COLORS[health],
      flexShrink: 0,
      boxShadow: `0 0 6px ${HEALTH_COLORS[health]}88`,
    }} />
  );
}

function HealthChip({ health }) {
  const labels = { green: 'On Track', yellow: 'At Risk', red: 'Off Track' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: 'var(--radius-full)',
      color: HEALTH_COLORS[health],
      background: `${HEALTH_COLORS[health]}18`,
      border: `1px solid ${HEALTH_COLORS[health]}44`,
    }}>
      <HealthDot health={health} size={7} />
      {labels[health]}
    </span>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function NewPlanModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    prospectName: '',
    company: '',
    dealStage: 'Discovery',
    template: 'MEDDPICC',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.prospectName.trim()) return;
    onCreate(form);
  };

  return (
    <div className="overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="glass-card" style={{
        width: 460,
        padding: '28px 32px',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Create Success Plan
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
            }}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Prospect Name
            </label>
            <input
              type="text"
              value={form.prospectName}
              onChange={e => set('prospectName', e.target.value)}
              placeholder="e.g. Sarah Johnson"
              required
              style={inputStyle()}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Company
            </label>
            <input
              type="text"
              value={form.company}
              onChange={e => set('company', e.target.value)}
              placeholder="e.g. Acme Corp"
              style={inputStyle()}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Deal Stage
              </label>
              <select
                value={form.dealStage}
                onChange={e => set('dealStage', e.target.value)}
                style={inputStyle()}
              >
                {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Template
              </label>
              <select
                value={form.template}
                onChange={e => set('template', e.target.value)}
                style={inputStyle()}
              >
                {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="ghost"
              style={ghostBtnStyle()}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={primaryBtnStyle()}
            >
              Create Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function inputStyle(extra = {}) {
  return {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 14,
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    ...extra,
  };
}

function primaryBtnStyle(extra = {}) {
  return {
    background: 'var(--accent-primary)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 18px',
    cursor: 'pointer',
    ...extra,
  };
}

function ghostBtnStyle(extra = {}) {
  return {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 16px',
    cursor: 'pointer',
    ...extra,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SuccessPlans = () => {
  const [plans, setPlans] = useState(() => loadPlans());
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const toast = useToast();
  const [hoveredMilestone, setHoveredMilestone] = useState(null);

  // Add milestone form state
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ description: '', owner: 'Rep', dueDate: addDays(14) });

  // Right pane notes auto-save
  const notesTimerRef = useRef(null);

  // Persist plans on change
  useEffect(() => {
    savePlans(plans);
  }, [plans]);

  // Select first plan on load
  useEffect(() => {
    if (!selectedId && plans.length > 0) {
      setSelectedId(plans[0].id);
    }
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedId) || null;

  // ── Plan CRUD ──────────────────────────────────────────────────────────────

  const handleCreatePlan = ({ prospectName, company, dealStage, template }) => {
    const newPlan = {
      id: genId(),
      prospectName: prospectName.trim(),
      company: company.trim(),
      dealStage,
      template,
      methodology: METHODOLOGY_MAP[template] || 'Custom',
      notes: '',
      createdAt: new Date().toISOString(),
      milestones: buildMilestones(template),
    };
    const updated = [newPlan, ...plans];
    setPlans(updated);
    setSelectedId(newPlan.id);
    setShowModal(false);
    toast(`Success Plan created for ${newPlan.prospectName}`, 'success');
  };

  const updatePlan = (id, patch) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const toggleMilestone = (planId, milestoneId) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      return {
        ...p,
        milestones: p.milestones.map(m =>
          m.id === milestoneId ? { ...m, done: !m.done } : m
        ),
      };
    }));
  };

  const deleteMilestone = (planId, milestoneId) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      return { ...p, milestones: p.milestones.filter(m => m.id !== milestoneId) };
    }));
  };

  const addMilestone = (planId) => {
    if (!newMilestone.description.trim()) return;
    const m = {
      id: genId(),
      description: newMilestone.description.trim(),
      owner: newMilestone.owner,
      dueDate: newMilestone.dueDate,
      done: false,
    };
    setPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, milestones: [...p.milestones, m] } : p
    ));
    setNewMilestone({ description: '', owner: 'Rep', dueDate: addDays(14) });
    setShowAddMilestone(false);
  };

  const handleNotesChange = (planId, value) => {
    updatePlan(planId, { notes: value });
  };

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}/success-plans/${selectedId}?token=${genId()}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast('Share link copied to clipboard', 'info');
    } catch {
      toast('Clipboard access denied — copy the URL manually', 'warning');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const paneBase = {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
              Success Plans
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Mutual Action Plans — shared deal milestones between you and your buyers
            </p>
          </div>
          <div className="page-header-meta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {plans.length} plan{plans.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Three-pane layout ── */}
      <div className="split-pane" style={{ display: 'flex', flex: 1, overflow: 'hidden', margin: 0 }}>

        {/* ── LEFT PANE: Plan list ── */}
        <div
          className="left-pane"
          style={{
            ...paneBase,
            width: 280,
            minWidth: 280,
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
          }}
        >
          {/* Left header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Plans
            </span>
            <button
              onClick={() => setShowModal(true)}
              style={{
                ...primaryBtnStyle(),
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              + New Plan
            </button>
          </div>

          {/* Search */}
          {plans.length > 0 && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <input
                value={planSearch}
                onChange={e => setPlanSearch(e.target.value)}
                placeholder="Search plans…"
                style={{ width: '100%', fontSize: 12, padding: '6px 10px' }}
              />
            </div>
          )}

          {/* Plan list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {plans.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🤝</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                  No plans yet.
                </p>
                <button onClick={() => setShowModal(true)} style={{ fontSize: 12, padding: '6px 14px' }}>
                  + New Plan
                </button>
              </div>
            ) : (
              plans
                .filter(p => !planSearch || `${p.prospectName} ${p.company}`.toLowerCase().includes(planSearch.toLowerCase()))
                .map(plan => {
                const health = computeHealth(plan.milestones);
                const done = plan.milestones.filter(m => m.done).length;
                const isSelected = plan.id === selectedId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => { setSelectedId(plan.id); setShowAddMilestone(false); }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      background: isSelected ? 'var(--accent-dim)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {plan.prospectName || 'Unnamed'}
                        </div>
                        {plan.company && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {plan.company}
                          </div>
                        )}
                      </div>
                      <HealthDot health={health} size={9} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <StageBadge stage={plan.dealStage} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      {plan.milestones.length} milestone{plan.milestones.length !== 1 ? 's' : ''} &middot; {done} done
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── CENTER PANE: Plan detail ── */}
        <div
          className="center-pane"
          style={{
            ...paneBase,
            flex: 1,
            background: 'var(--bg-primary)',
            borderRight: '1px solid var(--border-subtle)',
          }}
        >
          {!selectedPlan ? (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>🤝</div>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300 }}>
                Select a plan from the left to view its milestones and details.
              </p>
            </div>
          ) : (
            <>
              {/* Center header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                flexShrink: 0,
                background: 'var(--bg-secondary)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedPlan.prospectName}
                        {selectedPlan.company && (
                          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                            @ {selectedPlan.company}
                          </span>
                        )}
                      </div>
                    </div>
                    <StageBadge stage={selectedPlan.dealStage} />
                    <HealthChip health={computeHealth(selectedPlan.milestones)} />
                  </div>
                  <button
                    onClick={handleShareLink}
                    style={{
                      ...ghostBtnStyle(),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: copiedLink ? 'var(--status-success)' : 'var(--text-secondary)',
                      borderColor: copiedLink ? 'var(--status-success)' : undefined,
                      transition: 'color 0.2s, border-color 0.2s',
                    }}
                  >
                    {copiedLink ? 'Copied!' : 'Share Link'}
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

                {/* Milestone section */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Milestones
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {selectedPlan.milestones.filter(m => m.done).length} / {selectedPlan.milestones.length} complete
                    </span>
                  </div>

                  {/* Progress bar */}
                  {selectedPlan.milestones.length > 0 && (
                    <div style={{
                      height: 4,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-full)',
                      marginBottom: 16,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(selectedPlan.milestones.filter(m => m.done).length / selectedPlan.milestones.length) * 100}%`,
                        background: 'var(--accent-primary)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  )}

                  {/* Rep tasks */}
                  {selectedPlan.milestones.filter(m => m.owner === 'Rep').length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-info)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 2 }}>
                        Rep Tasks
                      </div>
                      {selectedPlan.milestones.filter(m => m.owner === 'Rep').map(m => (
                        <MilestoneRow
                          key={m.id}
                          milestone={m}
                          isHovered={hoveredMilestone === m.id}
                          onHover={setHoveredMilestone}
                          onToggle={() => toggleMilestone(selectedPlan.id, m.id)}
                          onDelete={() => deleteMilestone(selectedPlan.id, m.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Buyer tasks */}
                  {selectedPlan.milestones.filter(m => m.owner === 'Buyer').length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 2 }}>
                        Buyer Tasks
                      </div>
                      {selectedPlan.milestones.filter(m => m.owner === 'Buyer').map(m => (
                        <MilestoneRow
                          key={m.id}
                          milestone={m}
                          isHovered={hoveredMilestone === m.id}
                          onHover={setHoveredMilestone}
                          onToggle={() => toggleMilestone(selectedPlan.id, m.id)}
                          onDelete={() => deleteMilestone(selectedPlan.id, m.id)}
                        />
                      ))}
                    </div>
                  )}

                  {selectedPlan.milestones.length === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: '8px 0' }}>
                      No milestones yet. Add one below.
                    </p>
                  )}

                  {/* Add milestone */}
                  {showAddMilestone ? (
                    <div style={{
                      marginTop: 12,
                      padding: '14px 16px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}>
                      <input
                        type="text"
                        placeholder="Milestone description..."
                        value={newMilestone.description}
                        onChange={e => setNewMilestone(n => ({ ...n, description: e.target.value }))}
                        autoFocus
                        style={inputStyle()}
                        onKeyDown={e => { if (e.key === 'Enter') addMilestone(selectedPlan.id); if (e.key === 'Escape') setShowAddMilestone(false); }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Owner:</span>
                          {['Rep', 'Buyer'].map(o => (
                            <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13, color: newMilestone.owner === o ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              <input
                                type="radio"
                                name="newMilestoneOwner"
                                value={o}
                                checked={newMilestone.owner === o}
                                onChange={() => setNewMilestone(n => ({ ...n, owner: o, dueDate: addDays(o === 'Rep' ? 14 : 21) }))}
                                style={{ accentColor: 'var(--accent-primary)' }}
                              />
                              {o}
                            </label>
                          ))}
                        </div>
                        <input
                          type="date"
                          value={newMilestone.dueDate}
                          onChange={e => setNewMilestone(n => ({ ...n, dueDate: e.target.value }))}
                          style={{ ...inputStyle(), width: 'auto', fontSize: 12 }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => addMilestone(selectedPlan.id)} style={primaryBtnStyle({ fontSize: 12, padding: '6px 14px' })}>
                          Add
                        </button>
                        <button onClick={() => setShowAddMilestone(false)} style={ghostBtnStyle({ fontSize: 12, padding: '6px 12px' })}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddMilestone(true)}
                      style={{
                        marginTop: 10,
                        background: 'transparent',
                        border: '1px dashed var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                    >
                      + Add Milestone
                    </button>
                  )}
                </div>

                {/* Buyer Engagement card */}
                <BuyerEngagementCard />
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT PANE: Metadata ── */}
        <div
          className="right-pane"
          style={{
            ...paneBase,
            width: 240,
            minWidth: 240,
            background: 'var(--bg-secondary)',
          }}
        >
          {selectedPlan ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>

              {/* Plan Details */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Plan Details
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Deal Stage
                    </label>
                    <select
                      value={selectedPlan.dealStage}
                      onChange={e => updatePlan(selectedPlan.id, { dealStage: e.target.value })}
                      style={{ ...inputStyle(), fontSize: 12, padding: '6px 10px' }}
                    >
                      {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Notes
                    </label>
                    <textarea
                      value={selectedPlan.notes || ''}
                      onChange={e => handleNotesChange(selectedPlan.id, e.target.value)}
                      placeholder="Add context, next steps..."
                      rows={4}
                      style={{
                        ...inputStyle(),
                        resize: 'vertical',
                        fontSize: 12,
                        lineHeight: 1.5,
                        minHeight: 80,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Methodology chip */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Methodology
                </div>
                <span style={{
                  display: 'inline-block',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-dim)',
                  color: 'var(--accent-light)',
                  border: '1px solid var(--border-accent)',
                  letterSpacing: '0.04em',
                }}>
                  {selectedPlan.methodology || 'Custom'}
                </span>
              </div>

              {/* Activity Feed */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Activity Feed
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {MOCK_ACTIVITY.map((entry, idx) => (
                    <div key={entry.id} style={{ display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' }}>
                      {/* timeline line */}
                      {idx < MOCK_ACTIVITY.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          left: 5,
                          top: 14,
                          bottom: 0,
                          width: 1,
                          background: 'var(--border-subtle)',
                        }} />
                      )}
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'var(--border-accent)',
                        flexShrink: 0,
                        marginTop: 3,
                        zIndex: 1,
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {entry.text}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {entry.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                Select a plan to view details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <NewPlanModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreatePlan}
        />
      )}
    </div>
  );
};

// ─── Milestone Row ─────────────────────────────────────────────────────────────

function MilestoneRow({ milestone, isHovered, onHover, onToggle, onDelete }) {
  const overdue = !milestone.done && isOverdue(milestone.dueDate);
  const ownerColor = milestone.owner === 'Rep' ? 'var(--status-info)' : '#a78bfa';
  const ownerBg = milestone.owner === 'Rep' ? 'var(--status-info-dim)' : 'rgba(167,139,250,0.12)';
  const ownerBorder = milestone.owner === 'Rep' ? 'var(--status-info-border)' : 'rgba(167,139,250,0.3)';

  return (
    <div
      onMouseEnter={() => onHover(milestone.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        background: isHovered ? 'var(--bg-secondary)' : 'transparent',
        marginBottom: 2,
        transition: 'background 0.1s',
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={milestone.done}
        onChange={onToggle}
        style={{
          width: 16,
          height: 16,
          accentColor: 'var(--accent-primary)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />

      {/* Description */}
      <span style={{
        flex: 1,
        fontSize: 13,
        color: milestone.done ? 'var(--text-muted)' : 'var(--text-primary)',
        textDecoration: milestone.done ? 'line-through' : 'none',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {milestone.description || <em style={{ color: 'var(--text-muted)' }}>Untitled</em>}
      </span>

      {/* Owner badge */}
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 'var(--radius-full)',
        color: ownerColor,
        background: ownerBg,
        border: `1px solid ${ownerBorder}`,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        flexShrink: 0,
      }}>
        {milestone.owner}
      </span>

      {/* Due date */}
      {milestone.dueDate && (
        <span style={{
          fontSize: 11,
          color: overdue ? 'var(--status-danger)' : 'var(--text-muted)',
          fontWeight: overdue ? 700 : 400,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {overdue ? 'Overdue · ' : ''}{milestone.dueDate}
        </span>
      )}

      {/* Delete button (hover only) */}
      <button
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--status-danger)',
          cursor: 'pointer',
          fontSize: 14,
          lineHeight: 1,
          padding: '2px 4px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.15s',
          flexShrink: 0,
        }}
        title="Delete milestone"
      >
        x
      </button>
    </div>
  );
}

// ─── Buyer Engagement Card ────────────────────────────────────────────────────

function BuyerEngagementCard() {
  const metrics = [
    { label: 'Last viewed', value: '2 days ago' },
    { label: 'Total views', value: '7' },
    { label: 'Avg. time on page', value: '4m 12s' },
    { label: 'Resources opened', value: '2' },
  ];

  return (
    <div className="glass-card" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Buyer Engagement
        </h4>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          color: 'var(--status-success)',
          background: 'var(--status-success-dim)',
          border: '1px solid var(--status-success-border)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Active
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SuccessPlans;
