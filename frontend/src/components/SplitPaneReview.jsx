// This component is a reusable embedded split-pane review widget.
// The full-page HITL experience lives in HITLReviewView.jsx.
// This component is kept for backwards-compatible use inside other pages.

import React, { useState } from 'react';

const SplitPaneReview = ({ tasks = [], onAccept, onReject, onInlineEdit }) => {
  const [selected, setSelected] = useState(0);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const current = tasks[selected];

  const handleEdit = () => {
    setEditContent(current?.draftContent || current || '');
    setIsEditing(true);
  };

  const handleAccept = () => {
    onAccept && onAccept(isEditing ? editContent : current);
    setIsEditing(false);
    if (selected < tasks.length - 1) setSelected(s => s + 1);
  };

  const handleReject = () => {
    onReject && onReject(current);
    if (selected < tasks.length - 1) setSelected(s => s + 1);
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {/* Left: Queue */}
      <div style={{ width: 200, borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Review Queue
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tasks.map((task, i) => (
            <div
              key={i}
              onClick={() => { setSelected(i); setIsEditing(false); }}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: '0.85rem',
                backgroundColor: selected === i ? 'var(--accent-dim)' : 'transparent',
                borderLeft: selected === i ? '3px solid var(--accent-primary)' : '3px solid transparent',
                color: selected === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              {typeof task === 'string' ? task : task.label || `Item ${i + 1}`}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Action Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Agentic Action Panel
        </div>
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '8px 12px', backgroundColor: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-sm)' }}>
            AI Summary: Reviewing item {selected + 1} of {tasks.length}
          </div>

          {isEditing ? (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              style={{ flex: 1, padding: 12, fontSize: '0.85rem', resize: 'none', lineHeight: 1.6, fontFamily: 'inherit', minHeight: 120 }}
            />
          ) : (
            <div style={{ flex: 1, padding: 12, backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflowY: 'auto', minHeight: 120 }}>
              {current && (typeof current === 'string' ? current : current.draftContent || JSON.stringify(current, null, 2))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleAccept} style={{ backgroundColor: 'var(--status-success)', color: '#fff', padding: '8px 16px', fontSize: '0.85rem', flex: 1 }}>
              ✓ Accept
            </button>
            <button onClick={handleEdit} style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', padding: '8px 16px', fontSize: '0.85rem', flex: 1 }}>
              ✎ Edit
            </button>
            <button onClick={handleReject} className="danger" style={{ padding: '8px 16px', fontSize: '0.85rem', flex: 1 }}>
              ✗ Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPaneReview;
