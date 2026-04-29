import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from './Toast';
import { STEP_TYPE_CONFIG } from '../constants';

const TASK_TYPES = ['AUTO_EMAIL', 'CALL', 'LINKEDIN', 'TASK'];

const PRIORITY_COLORS = {
  high:   'var(--status-danger)',
  medium: 'var(--status-warning)',
  low:    'var(--status-success)',
};

const LS_KEY          = 'task_inbox_completions_v1';
const LS_SECTIONS_KEY = 'task_inbox_sections_v1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadCompletions() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveCompletions(set) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

function loadSections() {
  try { return JSON.parse(localStorage.getItem(LS_SECTIONS_KEY)) || { overdue: true, today: true, upcoming: true }; }
  catch { return { overdue: true, today: true, upcoming: true }; }
}

function saveSections(s) {
  try { localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(s)); } catch {}
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function relativeDueLabel(dueDate) {
  const now = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const diffMs = due - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

function classifyDue(dueDate) {
  const now = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const diffDays = Math.round((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return 'overdue';
  if (diffDays === 0) return 'today';
  return 'upcoming';
}

function primaryActionLabel(type) {
  switch (type) {
    case 'AUTO_EMAIL':
    case 'MANUAL_EMAIL': return 'Open Email';
    case 'CALL':         return 'Dial Now';
    case 'LINKEDIN':     return 'Open LinkedIn';
    default:             return 'Mark Done';
  }
}

function taskTypeLabel(type) {
  switch (type) {
    case 'AUTO_EMAIL':
    case 'MANUAL_EMAIL': return 'Email';
    case 'CALL':         return 'Call';
    case 'LINKEDIN':     return 'LinkedIn';
    default:             return 'Task';
  }
}

// ─── Task derivation ──────────────────────────────────────────────────────────

function deriveTasksFromData(sequences, prospects) {
  const prospectMap = {};
  (prospects || []).forEach(p => { prospectMap[p.id] = p; });

  const now = new Date();
  const tasks = [];

  (sequences || []).forEach(seq => {
    const enrollments = seq.prospectEnrollments || seq.enrollments || [];
    enrollments.forEach((enr, idx) => {
      if (enr.status !== 'active') return;

      const prospect = prospectMap[enr.prospectId] || {};
      const firstName = prospect.firstName || enr.firstName || 'Unknown';
      const lastName  = prospect.lastName  || enr.lastName  || '';
      const company   = prospect.companyName || prospect.company || enr.companyName || enr.company || '';
      const stepNumber = enr.currentStep   || enr.stepNumber || 1;

      // Vary task type by index
      const type = TASK_TYPES[idx % TASK_TYPES.length];

      // Stagger due dates: ~30% overdue, ~40% today, ~30% upcoming
      let dueDate;
      const bucket = idx % 10;
      if (bucket < 3) {
        // overdue: 1–3 days ago
        dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() - ((idx % 3) + 1));
      } else if (bucket < 7) {
        // due today
        dueDate = new Date(now);
        dueDate.setHours(0, 0, 0, 0);
      } else {
        // upcoming: +1 or +2 days
        dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + ((idx % 2) + 1));
      }

      // Vary priority
      const priorities = ['high', 'medium', 'low'];
      const priority = priorities[idx % 3];

      tasks.push({
        id: `${enr.id || seq.id}_${enr.prospectId || idx}`,
        type,
        prospectName: `${firstName} ${lastName}`.trim(),
        prospectCompany: company,
        sequenceName: seq.name || 'Unnamed Sequence',
        stepNumber,
        dueDate,
        priority,
      });
    });
  });

  return tasks;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeChip({ type }) {
  const cfg = STEP_TYPE_CONFIG[type] || STEP_TYPE_CONFIG.TASK;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      borderRadius: 'var(--radius-sm)',
      background: cfg.bg,
      color: cfg.color,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 12 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function PriorityDot({ priority }) {
  return (
    <span
      title={`${priority} priority`}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: PRIORITY_COLORS[priority] || 'var(--text-muted)',
        flexShrink: 0,
      }}
    />
  );
}

function StatChip({ label, value, color }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 10px',
      borderRadius: 'var(--radius-full)',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-subtle)',
      fontSize: 12,
      color: 'var(--text-secondary)',
    }}>
      <span style={{ fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</span>
      {label}
    </span>
  );
}

function TaskRow({ task, onComplete, onSkip }) {
  const [hovered, setHovered] = useState(false);
  const dueLabel = relativeDueLabel(task.dueDate);
  const bucket = classifyDue(task.dueDate);

  const dueLabelColor =
    bucket === 'overdue' ? 'var(--status-danger)'  :
    bucket === 'today'   ? 'var(--status-warning)'  :
    'var(--status-success)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        background: hovered ? 'var(--bg-tertiary)' : 'transparent',
        border: '1px solid',
        borderColor: hovered ? 'var(--border-color)' : 'var(--border-subtle)',
        marginBottom: 6,
        transition: 'background var(--transition-fast), border-color var(--transition-fast)',
        cursor: 'default',
      }}
    >
      {/* Type chip */}
      <TypeChip type={task.type} />

      {/* Prospect info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PriorityDot priority={task.priority} />
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.prospectName}
          </span>
          {task.prospectCompany && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              · {task.prospectCompany}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {task.sequenceName} · {taskTypeLabel(task.type)}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: dueLabelColor }}>
            {dueLabel}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onComplete(task.id)}
          style={{
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {primaryActionLabel(task.type)}
        </button>
        <button
          onClick={() => onSkip(task.id)}
          className="ghost"
          style={{
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'color var(--transition-fast), border-color var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

const SECTION_DIM = {
  'var(--status-danger)':  'var(--status-danger-dim)',
  'var(--status-warning)': 'var(--status-warning-dim)',
  'var(--status-success)': 'var(--status-success-dim)',
};

function SectionHeader({ label, count, accentColor, isOpen, onToggle }) {
  const dimColor = SECTION_DIM[accentColor] || 'var(--accent-dim)';
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 0',
        marginBottom: isOpen ? 8 : 4,
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-muted)', transition: 'transform 0.15s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
      <span style={{ fontWeight: 700, fontSize: 13, color: accentColor }}>{label}</span>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        borderRadius: 'var(--radius-full)',
        background: dimColor,
        color: accentColor,
        fontSize: 11,
        fontWeight: 700,
      }}>
        {count}
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TaskInbox() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState(loadCompletions);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [confirmCompleteAll, setConfirmCompleteAll] = useState(false);
  const toast = useToast();

  // Filters
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Section collapse state — persisted across sessions
  const [sections, setSections] = useState(loadSections);

  // ── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [seqRes, proRes] = await Promise.all([
          api.get('/sequences'),
          api.get('/prospects'),
        ]);
        const derived = deriveTasksFromData(seqRes.data || [], proRes.data || []);
        setTasks(derived);
      } catch (err) {
        console.error('TaskInbox: failed to load data', err);
        setError('Failed to load tasks. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Dismiss helpers ─────────────────────────────────────────────────────────
  function dismissTask(id, isSkip = false) {
    const task = tasks.find(t => t.id === id);
    const next = new Set(completions);
    next.add(id);
    setCompletions(next);
    saveCompletions(next);
    if (isSkip) {
      toast(`Skipped${task ? ` · ${task.prospectName}` : ''}`, 'info', 2000);
    } else {
      const label = task ? `${STEP_TYPE_CONFIG[task.type]?.icon || ''} ${task.prospectName}` : 'Task';
      toast(`${label} — done`, 'success', 2200);
    }
  }

  function completeAllToday() {
    const todayTasks = visibleTasks.filter(t => classifyDue(t.dueDate) === 'today');
    const next = new Set(completions);
    todayTasks.forEach(t => next.add(t.id));
    setCompletions(next);
    saveCompletions(next);
    setConfirmCompleteAll(false);
    toast(`${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} completed`, 'success');
  }

  // ── Derived lists ────────────────────────────────────────────────────────────
  const visibleTasks = tasks.filter(t => {
    if (completions.has(t.id)) return false;
    if (typeFilter !== 'ALL') {
      const map = { EMAIL: ['AUTO_EMAIL', 'MANUAL_EMAIL'], CALL: ['CALL'], LINKEDIN: ['LINKEDIN'], TASK: ['TASK'] };
      if (!map[typeFilter]?.includes(t.type)) return false;
    }
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter.toLowerCase()) return false;
    return true;
  });

  const overdueTasks  = visibleTasks.filter(t => classifyDue(t.dueDate) === 'overdue');
  const todayTasks    = visibleTasks.filter(t => classifyDue(t.dueDate) === 'today');
  const upcomingTasks = visibleTasks.filter(t => classifyDue(t.dueDate) === 'upcoming');

  // Counts for filter sidebar (based on non-completed tasks, ignoring current filters)
  const pendingTasks = tasks.filter(t => !completions.has(t.id));
  const typeCount = (key) => {
    const map = { EMAIL: ['AUTO_EMAIL', 'MANUAL_EMAIL'], CALL: ['CALL'], LINKEDIN: ['LINKEDIN'], TASK: ['TASK'] };
    return key === 'ALL' ? pendingTasks.length : pendingTasks.filter(t => map[key]?.includes(t.type)).length;
  };
  const priorityCount = (key) =>
    key === 'ALL' ? pendingTasks.length : pendingTasks.filter(t => t.priority === key.toLowerCase()).length;

  const filtersActive = typeFilter !== 'ALL' || priorityFilter !== 'ALL';

  // ── Toggle section ───────────────────────────────────────────────────────────
  function toggleSection(key) {
    setSections(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveSections(next);
      return next;
    });
  }

  // ── Loading / Error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 0, height: '100%' }}>
        <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[80, 60, 70, 55, 65].map((w, i) => <div key={i} className="skeleton" style={{ height: 28, width: `${w}%`, borderRadius: 'var(--radius-sm)' }} />)}
        </div>
        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 22, width: 140, borderRadius: 'var(--radius-sm)', marginBottom: 8 }} />
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 68, borderRadius: 'var(--radius-sm)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--status-danger)', fontSize: 14 }}>
        {error}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const typeFilters = [
    { key: 'ALL',      label: 'All' },
    { key: 'EMAIL',    label: 'Email' },
    { key: 'CALL',     label: 'Call' },
    { key: 'LINKEDIN', label: 'LinkedIn' },
    { key: 'TASK',     label: 'Task' },
  ];

  const priorityFilters = [
    { key: 'ALL',    label: 'All' },
    { key: 'HIGH',   label: 'High' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'LOW',    label: 'Low' },
  ];

  const allEmpty = visibleTasks.length === 0;

  return (
    <div className="split-pane" style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <aside style={{
        flex: '0 0 260px',
        borderRight: '1px solid var(--border-subtle)',
        padding: '20px 16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        background: 'var(--bg-primary)',
      }}>
        {/* Title */}
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Task Inbox</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Your priority queue</p>
        </div>

        {/* Type filter */}
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Task Type
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {typeFilters.map(f => {
              const cnt = typeCount(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: typeFilter === f.key ? 'var(--accent-dim)' : 'transparent',
                    color: typeFilter === f.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: typeFilter === f.key ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast), color var(--transition-fast)',
                  }}
                >
                  {f.label}
                  {cnt > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: typeFilter === f.key ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority filter */}
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Priority
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {priorityFilters.map(f => {
              const cnt = priorityCount(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => setPriorityFilter(f.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: priorityFilter === f.key ? 'var(--accent-dim)' : 'transparent',
                    color: priorityFilter === f.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: priorityFilter === f.key ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast), color var(--transition-fast)',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {f.key !== 'ALL' && (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: PRIORITY_COLORS[f.key.toLowerCase()] || 'var(--text-muted)',
                      }} />
                    )}
                    {f.label}
                  </span>
                  {cnt > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: priorityFilter === f.key ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </aside>

      {/* ── Center pane ──────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}>
        {/* Stats bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
        }}>
          <StatChip label="due today"  value={todayTasks.length}    color="var(--status-warning)" />
          <StatChip label="overdue"    value={overdueTasks.length}   color="var(--status-danger)"  />
          <StatChip label="upcoming"   value={upcomingTasks.length}  color="var(--status-success)" />

          <div style={{ flex: 1 }} />

          {todayTasks.length > 0 && (
            confirmCompleteAll ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mark {todayTasks.length} done?</span>
                <button
                  onClick={completeAllToday}
                  style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--status-danger)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmCompleteAll(false)}
                  className="ghost"
                  style={{ padding: '5px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCompleteAll(true)}
                style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-accent)', background: 'var(--accent-dim)', color: 'var(--accent-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Complete All Today
              </button>
            )
          )}
        </div>

        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {allEmpty ? (
            filtersActive ? (
              // Filters are hiding everything — make that obvious
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
                <span style={{ fontSize: 32, opacity: 0.4 }}>🔍</span>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>No tasks match your filters</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 240 }}>
                  {pendingTasks.length > 0 ? `You have ${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} hidden by filters.` : 'Try adjusting your filters.'}
                </p>
                <button
                  onClick={() => { setTypeFilter('ALL'); setPriorityFilter('ALL'); }}
                  style={{ fontSize: 13, padding: '8px 18px', marginTop: 4 }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              // Genuinely no tasks
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
                <span style={{ fontSize: 36 }}>✓</span>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>All caught up!</p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 260 }}>
                  No tasks due right now. Keep the momentum going.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button onClick={() => navigate('/dialer')} style={{ fontSize: 13, padding: '8px 16px' }}>
                    📞 Start a call session
                  </button>
                  <button className="secondary" onClick={() => navigate('/prospects')} style={{ fontSize: 13, padding: '8px 16px' }}>
                    👥 Review prospects
                  </button>
                </div>
              </div>
            )
          ) : (
            <>
              {/* Overdue section */}
              {overdueTasks.length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <SectionHeader
                    label="Overdue"
                    count={overdueTasks.length}
                    accentColor="var(--status-danger)"
                    isOpen={sections.overdue}
                    onToggle={() => toggleSection('overdue')}
                  />
                  {sections.overdue && overdueTasks.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={(id) => dismissTask(id, false)} onSkip={(id) => dismissTask(id, true)} />
                  ))}
                </section>
              )}

              {/* Due Today section */}
              {todayTasks.length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <SectionHeader
                    label="Due Today"
                    count={todayTasks.length}
                    accentColor="var(--status-warning)"
                    isOpen={sections.today}
                    onToggle={() => toggleSection('today')}
                  />
                  {sections.today && todayTasks.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={(id) => dismissTask(id, false)} onSkip={(id) => dismissTask(id, true)} />
                  ))}
                </section>
              )}

              {/* Upcoming section */}
              {upcomingTasks.length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <SectionHeader
                    label="Upcoming"
                    count={upcomingTasks.length}
                    accentColor="var(--status-success)"
                    isOpen={sections.upcoming}
                    onToggle={() => toggleSection('upcoming')}
                  />
                  {sections.upcoming && upcomingTasks.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={(id) => dismissTask(id, false)} onSkip={(id) => dismissTask(id, true)} />
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
