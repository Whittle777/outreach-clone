import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SequenceSteps = () => {
  const [steps, setSteps] = useState([]);
  const [form, setForm] = useState({ sequenceId: '', order: 1, delayDays: 0, subject: '', body: '' });
  const [isAdding, setIsAdding] = useState(false);

  const fetchSteps = async () => {
    try {
      const res = await api.get('/sequenceSteps');
      setSteps(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSteps(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sequenceSteps', form);
      setForm({ sequenceId: '', order: 1, delayDays: 0, subject: '', body: '' });
      setIsAdding(false);
      fetchSteps();
    } catch (err) { console.error(err); }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/sequenceSteps/${id}`);
      fetchSteps();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: 4 }}>Sequence Steps</h1>
          <p className="page-header-meta">{steps.length} steps across all sequences</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setIsAdding(v => !v)}>
            {isAdding ? '✕ Cancel' : '+ New Step'}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="glass-card">
          <h3 style={{ marginBottom: 16 }}>Create Step</h3>
          <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sequence ID</label>
                <input
                  placeholder="e.g. 1"
                  value={form.sequenceId}
                  onChange={e => setForm({ ...form, sequenceId: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 120 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Order</label>
                <input
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={e => setForm({ ...form, order: Number(e.target.value) })}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 120 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Delay Days</label>
                <input
                  type="number"
                  min="0"
                  value={form.delayDays}
                  onChange={e => setForm({ ...form, delayDays: Number(e.target.value) })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Subject</label>
              <input
                placeholder="Email subject line…"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Body</label>
              <textarea
                rows={4}
                placeholder="Email body template… Use {{firstName}}, {{company}} etc."
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button type="submit">Create Step</button>
              <button type="button" className="secondary" onClick={() => setIsAdding(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0 }}>All Steps</h3>
        </div>
        {steps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✉️</div>
            <h4>No steps yet</h4>
            <p>Create a step above, or manage steps via the Sequence Manager.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sequence</th>
                <th>Order</th>
                <th>Delay</th>
                <th>Subject</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {steps.map(s => (
                <tr key={s.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-code)', color: 'var(--accent-secondary)', padding: '2px 7px', borderRadius: 'var(--radius-xs)' }}>
                      #{s.sequenceId}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>Step {s.order}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: s.delayDays === 0 ? 'var(--status-success)' : 'var(--text-secondary)' }}>
                      {s.delayDays === 0 ? 'Immediate' : `${s.delayDays}d`}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{s.subject || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>
                    <button
                      className="ghost"
                      style={{ fontSize: '0.78rem', color: 'var(--status-danger)', padding: '4px 10px' }}
                      onClick={() => remove(s.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SequenceSteps;
