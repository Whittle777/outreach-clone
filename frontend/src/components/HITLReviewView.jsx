import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './Toast';

const CONFIDENCE_THRESHOLDS = {
  HIGH: 85,
  MODERATE: 70,
};

const ConfidenceBadge = ({ score }) => {
  let color, label, bg;
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) {
    color = 'var(--status-success)'; bg = 'var(--status-success-soft)'; label = 'Auto-Execute';
  } else if (score >= CONFIDENCE_THRESHOLDS.MODERATE) {
    color = 'var(--status-warning)'; bg = 'var(--status-warning-soft)'; label = 'Needs Review';
  } else {
    color = 'var(--status-danger)'; bg = 'var(--status-danger-soft)'; label = 'Escalate';
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, backgroundColor: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color, backgroundColor: bg, padding: '2px 8px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>
        {score}% · {label}
      </span>
    </div>
  );
};

// Normalise a backend queue item (minimal shape) to the rich shape the UI expects
const normaliseItem = (item) => ({
  ...item,
  prospect: item.prospect || {
    firstName: 'Queue Item',
    lastName: `#${item.id}`,
    companyName: '—',
    title: item.type,
    email: '—',
  },
  pipelineValue: item.pipelineValue || '—',
  reasoning: item.reasoning || [`[${item.type}] Confidence: ${item.confidenceScore}%`, item.aiSummary || ''],
  sourceData: item.sourceData || { recentEmail: '—', calls: 0, webVisits: 0, techStack: '—' },
});

const HITLReviewView = () => {
  const [queue, setQueue] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [actionLog, setActionLog] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchQueue = async () => {
    try {
      const res = await api.get('/hitl/queue');
      const items = (res.data || []).map(normaliseItem);
      setQueue(items);
      if (!selectedId && items.length > 0) setSelectedId(items[0].id);
    } catch (err) {
      console.error('Failed to fetch HITL queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const selected = queue.find(i => i.id === selectedId);

  useEffect(() => {
    if (selected) {
      setEditedContent(selected.draftContent);
      setIsEditing(false);
    }
  }, [selectedId, selected]);

  const handleAction = async (action) => {
    const timestamp = new Date().toLocaleTimeString();
    const prospectLabel = `${selected.prospect.firstName} ${selected.prospect.lastName}`;

    // Optimistic UI update
    setActionLog(prev => [{ id: selectedId, action, prospect: prospectLabel, timestamp }, ...prev]);
    setQueue(prev => prev.filter(i => i.id !== selectedId));
    const remaining = queue.filter(i => i.id !== selectedId);
    setSelectedId(remaining[0]?.id || null);

    const toastMsg = {
      'accepted':          `Approved email to ${prospectLabel}`,
      'rejected':          `Rejected draft for ${prospectLabel}`,
      'edited-and-accepted': `Edited & sent to ${prospectLabel}`,
      'escalated':         `Escalated ${prospectLabel} for manual review`,
    }[action];
    if (toastMsg) toast(toastMsg, action === 'rejected' ? 'warning' : 'success');

    // Persist to backend
    try {
      if (action === 'accepted') {
        await api.post(`/hitl/queue/${selectedId}/accept`);
      } else if (action === 'rejected') {
        await api.post(`/hitl/queue/${selectedId}/reject`);
      } else if (action === 'edited-and-accepted') {
        await api.post(`/hitl/queue/${selectedId}/edit`, { editedContent });
      } else if (action === 'escalated') {
        await api.post(`/hitl/queue/${selectedId}/escalate`);
      }
    } catch (err) {
      console.error(`HITL action "${action}" failed`, err);
      toast('Action failed — item has been re-queued', 'error');
      fetchQueue(); // restore optimistic removal on error
    }
  };

  const filteredQueue = queue.filter(item => {
    if (filter === 'escalate') return item.confidenceScore < CONFIDENCE_THRESHOLDS.MODERATE;
    if (filter === 'review') return item.confidenceScore >= CONFIDENCE_THRESHOLDS.MODERATE && item.confidenceScore < CONFIDENCE_THRESHOLDS.HIGH;
    if (filter === 'auto') return item.confidenceScore >= CONFIDENCE_THRESHOLDS.HIGH;
    return true;
  });

  const getUrgencyColor = (urgency) => {
    if (urgency === 'High') return 'var(--status-danger)';
    if (urgency === 'Medium') return 'var(--status-warning)';
    return 'var(--text-muted)';
  };

  // Keyboard shortcuts: J/K navigate, A accept, R reject, E escalate
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      const idx = filteredQueue.findIndex(i => i.id === selectedId);
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < filteredQueue.length - 1) setSelectedId(filteredQueue[idx + 1].id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) setSelectedId(filteredQueue[idx - 1].id);
      } else if (e.key === 'a' && selected && !isEditing) {
        handleAction('accepted');
      } else if (e.key === 'r' && selected && !isEditing) {
        handleAction('rejected');
      } else if (e.key === 'e' && selected && !isEditing) {
        handleAction('escalated');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, filteredQueue, selected, isEditing]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', gap: 0, backgroundColor: 'var(--bg-primary)' }}>

      {/* LEFT RAIL — Review Queue */}
      <div style={{ width: 320, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-color)' }}>
          {/* Labs / not-yet-active banner */}
          <div style={{ marginBottom: 14, padding: '9px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--accent-secondary)', lineHeight: 1.5 }}>
            <strong>Labs — not yet active.</strong> This queue will receive items when AI-assisted email workflows are enabled. For now it's a preview of how human-in-the-loop review will work: the AI drafts an email, you approve or edit before it sends.
          </div>
          <h3 style={{ marginBottom: 4, fontSize: '1rem' }}>Review Queue</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 16 }}>
            {loading ? 'Loading…' : `${queue.length} items pending human review`}
          </p>
          <div className="pill-group" style={{ flexWrap: 'wrap' }}>
            {[
              { key: 'all',      label: 'All' },
              { key: 'escalate', label: '🔴 Escalate' },
              { key: 'review',   label: '🟡 Review' },
              { key: 'auto',     label: '🟢 Auto' },
            ].map(f => (
              <button key={f.key} className={`pill-btn${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredQueue.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-state-icon">✅</div>
              <p>No items in this category</p>
            </div>
          )}
          {loading && (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 68 }} />)}
            </div>
          )}
          {filteredQueue.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              style={{
                padding: '16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                backgroundColor: selectedId === item.id ? 'var(--accent-dim)' : 'transparent',
                borderLeft: selectedId === item.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div
                    title={item.urgency || 'Normal'}
                    style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      backgroundColor: getUrgencyColor(item.urgency),
                      boxShadow: item.urgency === 'High' ? '0 0 6px var(--status-danger)' : 'none',
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.prospect.firstName} {item.prospect.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.prospect.companyName || item.prospect.company} · {item.type}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.pipelineValue}</div>
                </div>
              </div>
              <ConfidenceBadge score={item.confidenceScore} />
            </div>
          ))}
        </div>

        {/* Action Log */}
        {actionLog.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', maxHeight: 140, overflowY: 'auto', background: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Recent Actions</div>
            {actionLog.slice(0, 5).map((log, i) => {
              const color = log.action === 'accepted' || log.action === 'edited-and-accepted'
                ? 'var(--status-success)'
                : log.action === 'rejected' ? 'var(--status-danger)' : 'var(--status-warning)';
              const icon = log.action === 'accepted' || log.action === 'edited-and-accepted' ? '✓' : log.action === 'rejected' ? '✗' : '↑';
              return (
                <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5, display: 'flex', gap: 7, alignItems: 'baseline' }}>
                  <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.prospect}
                  </span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: '0.72rem' }}>{log.timestamp}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CENTER PANE — Contextual Record */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                {selected.prospect.firstName[0]}{selected.prospect.lastName[0]}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{selected.prospect.firstName} {selected.prospect.lastName}</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {selected.prospect.title} · {selected.prospect.companyName || selected.prospect.company} · {selected.prospect.email}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{selected.pipelineValue}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pipeline Value</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Engagement Context */}
            <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Omnichannel Context</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Web Visits', value: selected.sourceData.webVisits, icon: '🌐' },
                  { label: 'Calls Made', value: selected.sourceData.calls, icon: '📞' },
                  { label: 'Recent Email', value: selected.sourceData.recentEmail, icon: '✉️', wide: true },
                ].map(stat => (
                  <div key={stat.label} style={{ gridColumn: stat.wide ? 'span 3' : 'span 1', padding: '10px 14px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.1rem' }}>{stat.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Tech Stack</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.sourceData.techStack.split(', ').map(t => (
                    <span key={t} style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: 'var(--accent-dim)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-accent)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Reasoning Chain */}
            <div style={{ backgroundColor: 'var(--bg-code)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--status-warning)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🤖</span> AI Reasoning Chain
              </h4>
              {selected.reasoning.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontFamily: 'monospace', fontSize: '0.82rem', color: i === selected.reasoning.length - 1 ? 'var(--status-warning)' : '#94a3b8', opacity: i === selected.reasoning.length - 1 ? 1 : 0.75 }}>
                  <span>▶</span><span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          {queue.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
              <h3>Queue Empty</h3>
              <p style={{ color: 'var(--text-secondary)' }}>All items have been reviewed. Great work!</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Select an item from the queue</div>
          )}
        </div>
      )}

      {/* RIGHT PANE — Agentic Action Panel */}
      {selected && (
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Review &amp; Decide</h4>
            <div style={{ marginTop: 12 }}>
              <ConfidenceBadge score={selected.confidenceScore} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* AI Summary */}
            <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>AI Summary</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{selected.aiSummary}</p>
            </div>

            {/* Draft Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {selected.type === 'Email Draft' ? 'AI-Drafted Email' : 'AI-Drafted Script'}
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: isEditing ? 'var(--accent-soft)' : 'var(--bg-tertiary)', color: isEditing ? 'var(--accent-primary)' : 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                >
                  {isEditing ? '✎ Editing' : '✎ Inline Edit'}
                </button>
              </div>

              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  style={{ flex: 1, minHeight: 280, padding: 14, fontSize: '0.88rem', lineHeight: 1.6, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', resize: 'none', fontFamily: 'inherit' }}
                />
              ) : (
                <div style={{ flex: 1, padding: 14, fontSize: '0.88rem', lineHeight: 1.6, backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', overflowY: 'auto', minHeight: 280 }}>
                  {editedContent}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              {[['A', 'Accept'], ['R', 'Reject'], ['E', 'Escalate'], ['J/K', 'Navigate']].map(([key, label]) => (
                <span key={key} style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <kbd style={{ padding: '1px 5px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 3, fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{key}</kbd>
                  {label}
                </span>
              ))}
            </div>
            <button
              onClick={() => handleAction('accepted')}
              className="success-btn"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              ✓ Accept &amp; Execute
            </button>
            {isEditing && (
              <button
                onClick={() => handleAction('edited-and-accepted')}
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              >
                ✎ Accept Edited Version
              </button>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleAction('rejected')}
                className="danger"
                style={{ flex: 1, padding: '10px' }}
              >
                ✗ Reject
              </button>
              <button
                onClick={() => handleAction('escalated')}
                className="secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
              >
                ↑ Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HITLReviewView;
