import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from './Toast';
import { useIntegrations } from '../contexts/IntegrationContext';
import SetupTooltip from './SetupTooltip';

// ─── Suggested prompts shown as chips above the input ─────────────────────────
const SUGGESTED_PROMPTS = [
  'Build a call list of uncontacted prospects',
  'Show prospects who replied to an email',
  'Break down pipeline by company',
  'Which sequence has the most enrollments?',
];

// Cycle through placeholder text so users know the range of questions they can ask
const PLACEHOLDER_CYCLE = [
  'e.g. How many prospects are in the Pepsi account?',
  'e.g. Break down my pipeline by company',
  'e.g. Find VP-level contacts at SaaS companies',
  'e.g. Which sequence has the most active enrollments?',
  'e.g. Create a call list of all uncontacted prospects',
];

// ─── Inline stat badge inside query answer bubbles ────────────────────────────
const StatBadge = ({ label, value }) => (
  <div style={{
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
    padding: '8px 16px', borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent-medium)',
    minWidth: 72,
  }}>
    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 4, textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
  </div>
);

// ─── Action button — constrained width, text always fits ─────────────────────
const ActionBtn = ({ label, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '8px 14px',
      fontSize: '0.82rem', fontWeight: 600,
      background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
      borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      transition: 'background var(--transition-fast)',
      textAlign: 'left', whiteSpace: 'nowrap',
      overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--accent-soft)'; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'var(--accent-dim)'; }}
  >
    ↗ {label}
  </button>
);

// ─── Bar used in the analysis breakdown card ──────────────────────────────────
const SegmentBar = ({ label, count, percentage, maxCount, onAction, actionLabel, disabled }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>{count}</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 34, textAlign: 'right', flexShrink: 0 }}>{percentage}%</span>
      {actionLabel && (
        <button
          onClick={onAction}
          disabled={disabled}
          title={actionLabel}
          style={{
            fontSize: '0.68rem', padding: '2px 8px', fontWeight: 600,
            background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
            borderRadius: 4, color: 'var(--accent-primary)', cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1, flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          List ↗
        </button>
      )}
    </div>
    <div style={{ height: 4, backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, (count / maxCount) * 100)}%`, height: '100%',
        background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
        borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease',
      }} />
    </div>
  </div>
);

// ─── Main Dashboard component ─────────────────────────────────────────────────
const Dashboard = () => {
  const { isConfigured } = useIntegrations();
  // AI is available when Claude or Gemini is saved in DB, OR when Gemini env key is present
  // (Gemini key is baked into .env so the backend always has AI — we only block if the
  // orchestration endpoint itself returns an error, not upfront in the UI)
  const claudeReady = isConfigured('claude') || isConfigured('gemini') || true;
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', isWelcome: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // List editor state
  const [savedLists, setSavedLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [activeListData, setActiveListData] = useState(null);

  // Today's Queue stats
  const [todayStats, setTodayStats] = useState({ hitl: 0, neverCalled: 0, activeEnrollments: 0 });

  // Sequences for playlist enroll
  const [sequences, setSequences] = useState([]);
  const [enrollingListId, setEnrollingListId] = useState(null); // chat msg idx
  const [enrollingSeqId, setEnrollingSeqId] = useState('');
  const [enrollFeedback, setEnrollFeedback] = useState({}); // { [msgIdx]: msg }
  const [aiProvider, setAiProvider] = useState(null); // { name, model }
  const [expandedReasoning, setExpandedReasoning] = useState({}); // { [idx]: bool }

  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  // ── Cycle placeholder text every 4s while input is empty ──────────────────
  useEffect(() => {
    if (input) return;
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_CYCLE.length), 4000);
    return () => clearInterval(id);
  }, [input]);

  // ── Fetch saved lists ──────────────────────────────────────────────────────
  const fetchSavedLists = useCallback(async () => {
    try {
      const res = await api.get('/lists');
      setSavedLists(res.data);
    } catch (err) {
      console.error('Failed to fetch saved lists', err);
    }
  }, []);

  useEffect(() => { fetchSavedLists(); }, [fetchSavedLists]);

  // Detect active AI provider for the badge
  useEffect(() => {
    api.get('/integrations').then(r => {
      const creds = r.data || [];
      const claude = creds.find(c => c.provider === 'claude');
      if (claude) {
        const modelLabels = {
          'claude-opus-4-6':           'Claude Opus 4.6',
          'claude-sonnet-4-6':         'Claude Sonnet 4.6',
          'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
        };
        setAiProvider({ name: 'Claude', model: modelLabels[claude.clientSecret] || 'Claude' });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/sequences').then(r => setSequences(r.data || [])).catch(() => {});
  }, []);

  // ── Today's Queue stats ────────────────────────────────────────────────────
  useEffect(() => {
    // 'calls_prospect_timestamps' is the same key written by PowerDialerView
    // each time a dial is initiated. Reading it here lets us show how many
    // prospects still have an untouched phone number (the "Never Called" card).
    const CALL_TS_KEY = 'calls_prospect_timestamps';

    Promise.all([
      api.get('/prospects'),
      api.get('/sequences'),
      api.get('/emails').catch(() => ({ data: [] })),
    ]).then(([pRes, _sRes, eRes]) => {
      try {
        const ts        = JSON.parse(localStorage.getItem(CALL_TS_KEY) || '{}');
        const prospects = pRes.data || [];
        const emails    = eRes.data  || [];

        const neverCalled = prospects.filter(p => {
          const phone = p.trackingPixelData?.phone || p.phone;
          return phone && !ts[String(p.id)];
        }).length;

        const activeEnrollments = prospects.reduce(
          (acc, p) => acc + (p.sequenceEnrollments?.filter(e => e.status === 'active').length || 0),
          0
        );

        const hitl = emails.filter(e => e.status === 'Pending Review').length;
        setTodayStats({ hitl, neverCalled, activeEnrollments });
      } catch (err) {
        console.error('Failed to compute today stats:', err);
      }
    }).catch(err => console.error('Failed to fetch today stats data:', err));
  }, []);

  // ── Auto-scroll chat ─ only fires when new messages arrive or typing starts ─
  useEffect(() => {
    if (scrollRef.current && !activeListId) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatHistory.length, isTyping]);

  // ── List editor helpers ────────────────────────────────────────────────────
  const loadListEditor = async (id) => {
    try {
      setActiveListId(id);
      const res = await api.get(`/lists/${id}`);
      setActiveListData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateListMetadata = async (field, value) => {
    try {
      if (!activeListId || !activeListData) return;
      setActiveListData(prev => ({ ...prev, [field]: value }));
      await api.put(`/lists/${activeListId}`, { [field]: value });
      fetchSavedLists();
    } catch (err) {
      console.error(err);
      toast('Failed to save list changes', 'error');
    }
  };

  const removeProspectFromList = async (prospectId) => {
    try {
      await api.delete(`/lists/${activeListId}/prospects/${prospectId}`);
      setActiveListData(prev => ({
        ...prev,
        prospects: prev.prospects.filter(p => p.id !== prospectId),
      }));
      fetchSavedLists();
      toast('Prospect removed from list', 'info', 2500);
    } catch (err) {
      console.error(err);
      toast('Failed to remove prospect', 'error');
    }
  };

  // ── Core send handler — also called by action buttons (overridePrompt) ─────
  const handleSend = async (e, overridePrompt) => {
    if (e) e.preventDefault();
    const userMessage = (overridePrompt || input).trim();
    if (!userMessage || isTyping) return;

    setActiveListId(null);
    setInput('');

    const userEntry = { role: 'user', content: userMessage };
    setChatHistory(prev => [...prev, userEntry]);
    setIsTyping(true);

    // Build the simplified history to send as context (omit the entry we just added)
    const historyForContext = [...chatHistory, userEntry];

    try {
      const res = await api.post('/orchestration/nlq', {
        prompt: userMessage,
        conversationHistory: historyForContext,
      });
      const data = res.data;

      if (data.type === 'query') {
        setIsTyping(false);
        setChatHistory(prev => [...prev, {
          role: 'agent', type: 'query',
          answer: data.answer,
          stats: data.stats || [],
          actions: data.actions || [],
        }]);
        return;
      }

      if (data.type === 'analysis') {
        setIsTyping(false);
        setChatHistory(prev => [...prev, {
          role: 'agent', type: 'analysis',
          title: data.title,
          description: data.description,
          segments: data.segments || [],
          actions: data.actions || [],
        }]);
        return;
      }

      // type === 'action' — show reasoning then playlist card
      setChatHistory(prev => [...prev, {
        role: 'agent', type: 'reasoning',
        logs: data.reasoningLogs,
      }]);

      setTimeout(() => {
        setIsTyping(false);
        setChatHistory(prev => [...prev, {
          role: 'agent', type: 'action',
          content: 'I have strictly evaluated the CRM objects and successfully generated a Playlist payload matching your semantic constraints.',
          playlist: data.playlist,
        }]);
        fetchSavedLists();
      }, 1000);

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setChatHistory(prev => [...prev, {
        role: 'system',
        content: err.response?.data?.error || 'Failed to process query. Ensure GEMINI_API_KEY is configured in .env.',
      }]);
    }
  };

  // ── AI Enrichment ──────────────────────────────────────────────────────────
  const enrichDatabase = async () => {
    try {
      setIsTyping(true);
      setActiveListId(null);
      const res = await api.post('/prospects/enrich');
      setIsTyping(false);
      setChatHistory(prev => [...prev, {
        role: 'system',
        content: `Simulated Enrichment Complete: ${res.data.message}`,
      }]);
    } catch (err) {
      setIsTyping(false);
      setChatHistory(prev => [...prev, {
        role: 'system',
        content: err.response?.data?.error || 'Failed to enrich CRM data.',
      }]);
    }
  };

  // ── Enroll playlist prospects into a sequence ──────────────────────────────
  const enrollPlaylistInSequence = async (msgIdx, prospectIds, seqId) => {
    if (!seqId || !prospectIds?.length) return;
    try {
      await api.post(`/sequences/${seqId}/enroll`, { prospectIds });
      const seq = sequences.find(s => s.id === parseInt(seqId, 10));
      setEnrollFeedback(prev => ({ ...prev, [msgIdx]: { ok: true, msg: `${prospectIds.length} enrolled in "${seq?.name}"` } }));
      setEnrollingListId(null);
      setEnrollingSeqId('');
      toast(`${prospectIds.length} prospect${prospectIds.length !== 1 ? 's' : ''} enrolled in "${seq?.name}"`, 'success');
    } catch (err) {
      setEnrollFeedback(prev => ({ ...prev, [msgIdx]: { ok: false, msg: err.response?.data?.message || 'Enrollment failed' } }));
      toast('Enrollment failed', 'error');
    }
  };

  // ─── Message renderers ──────────────────────────────────────────────────────
  const renderMessage = (msg, idx) => {
    // ── System message ───────────────────────────────────────────────────────
    if (msg.role === 'system') {
      if (msg.isWelcome) {
        const caps = [
          { icon: '📊', label: 'Pipeline insights', example: 'How many prospects are in each status?' },
          { icon: '📋', label: 'Build call lists', example: 'Find all uncontacted prospects with a phone' },
          { icon: '🏢', label: 'Account breakdowns', example: 'Break down pipeline by company' },
          { icon: '✉️', label: 'Sequence analysis', example: 'Which sequence has the most active enrollments?' },
        ];
        return (
          <div key={idx} style={{ padding: '24px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6, color: 'var(--accent-primary)' }}>✦</div>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4, letterSpacing: '-0.01em' }}>Command Center</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', maxWidth: 300, lineHeight: 1.5, margin: 0 }}>
                Ask anything about your pipeline — or build a call list in seconds.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 480 }}>
              {caps.map(c => (
                <button
                  key={c.label}
                  onClick={() => handleSend(null, c.example)}
                  style={{
                    textAlign: 'left', padding: '10px 12px',
                    background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    transition: 'border-color var(--transition-fast), background var(--transition-fast)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
                >
                  <div style={{ fontSize: '0.95rem', marginBottom: 3 }}>{c.icon}</div>
                  <div style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{c.example}"</div>
                </button>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div key={idx} style={{ textAlign: 'center', margin: '16px 0', color: 'var(--text-secondary)' }}>
          <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '5px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.83rem' }}>
            {msg.content}
          </span>
        </div>
      );
    }

    // ── User bubble ──────────────────────────────────────────────────────────
    if (msg.role === 'user') {
      return (
        <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end', margin: '12px 0' }}>
          <div style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', padding: '10px 14px', borderRadius: '14px 14px 2px 14px', maxWidth: '72%', fontSize: '0.88rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
            {msg.content}
          </div>
        </div>
      );
    }

    if (msg.role === 'agent') {

      // ── Reasoning log (collapsed by default) ──────────────────────────────
      if (msg.type === 'reasoning') {
        const isOpen = !!expandedReasoning[idx];
        return (
          <div key={idx} style={{ display: 'flex', gap: 12, margin: '8px 0', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0, marginTop: 2 }}>✦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <button
                onClick={() => setExpandedReasoning(prev => ({ ...prev, [idx]: !prev[idx] }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', color: 'var(--text-muted)', fontSize: '0.76rem' }}
              >
                <span style={{ fontSize: '0.6rem', transform: isOpen ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                AI thinking… ({msg.logs.length} step{msg.logs.length !== 1 ? 's' : ''})
              </button>
              {isOpen && (
                <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.77rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {msg.logs.map((log, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, opacity: i === msg.logs.length - 1 ? 1 : 0.6 }}>
                      <span style={{ fontSize: '0.6rem', marginTop: 2, flexShrink: 0 }}>▶</span>
                      <span style={{ lineHeight: 1.45, wordBreak: 'break-word' }}>{log}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── Generated call list (action) ───────────────────────────────────────
      if (msg.type === 'action') {
        const playlist = msg.playlist;
        const hasItems = playlist?.items?.length > 0;
        return (
          <div key={idx} style={{ display: 'flex', gap: 12, margin: '14px 0', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0, marginTop: 2 }}>✦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 10, fontSize: '0.85rem', lineHeight: 1.5 }}>{msg.content}</div>
              {hasItems ? (
                <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {/* Playlist header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playlist.title}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {playlist.items.length} prospects · est. {playlist.estimatedTime}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        style={{ padding: '7px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        onClick={() => navigate('/dialer', { state: { prospects: playlist.items } })}
                      >
                        Dial ↗
                      </button>
                      {playlist.id && (
                        <button
                          className="secondary"
                          style={{ padding: '7px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                          onClick={() => loadListEditor(playlist.id)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prospect list */}
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {playlist.items.map((prospect, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid var(--border-subtle)', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prospect.firstName} {prospect.lastName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {[prospect.companyName, prospect.title].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--accent-dim)', color: 'var(--accent-primary)', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>Match</span>
                      </div>
                    ))}
                  </div>

                  {/* Enroll row */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
                    {enrollFeedback[idx]?.ok ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--status-success)', fontWeight: 600 }}>✓ {enrollFeedback[idx].msg}</div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select
                          value={enrollingListId === idx ? enrollingSeqId : ''}
                          onChange={(e) => { setEnrollingListId(idx); setEnrollingSeqId(e.target.value); }}
                          style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', padding: '7px 10px' }}
                        >
                          <option value="">Enroll in a sequence…</option>
                          {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button
                          className="secondary"
                          style={{ padding: '7px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                          disabled={!enrollingSeqId || enrollingListId !== idx}
                          onClick={() => enrollPlaylistInSequence(idx, playlist.items.map(p => p.id), enrollingSeqId)}
                        >
                          Enroll ({playlist.items.length})
                        </button>
                      </div>
                    )}
                    {enrollFeedback[idx]?.ok === false && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: 6 }}>✕ {enrollFeedback[idx].msg}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', border: '1px solid var(--status-warning-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-warning-dim)', color: 'var(--status-warning)', fontSize: '0.85rem' }}>
                  No prospects matched these filter criteria.
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── Conversational answer with optional stat badges + action buttons ────
      if (msg.type === 'query') {
        return (
          <div key={idx} style={{ display: 'flex', gap: 12, margin: '14px 0', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--status-success-soft)', border: '1px solid var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0, marginTop: 2 }}>✦</div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>
                {msg.answer}
              </div>
              {msg.stats.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {msg.stats.map((s, i) => <StatBadge key={i} label={s.label} value={s.value} />)}
                </div>
              )}
              {msg.actions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                  {msg.actions.map((a, i) => (
                    <ActionBtn key={i} label={a.label} onClick={() => handleSend(null, a.prompt)} disabled={isTyping} />
                  ))}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to generate a call list</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── Analysis breakdown card ────────────────────────────────────────────
      if (msg.type === 'analysis') {
        const maxCount = Math.max(...msg.segments.map(s => s.count), 1);
        return (
          <div key={idx} style={{ display: 'flex', gap: 12, margin: '14px 0', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--status-info-soft)', border: '1px solid var(--status-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0, marginTop: 2 }}>📊</div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{msg.title}</div>
                  {msg.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 3 }}>{msg.description}</div>}
                </div>
                {msg.segments.map((seg, i) => {
                  const matchingAction = msg.actions.find(a =>
                    a.label.toLowerCase().includes(seg.label.toLowerCase()) ||
                    a.prompt.toLowerCase().includes(seg.label.toLowerCase())
                  );
                  return (
                    <SegmentBar
                      key={i}
                      label={seg.label}
                      count={seg.count}
                      percentage={seg.percentage}
                      maxCount={maxCount}
                      actionLabel={matchingAction?.label}
                      onAction={() => handleSend(null, matchingAction?.prompt)}
                      disabled={isTyping}
                    />
                  );
                })}
              </div>
              {msg.actions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                  {msg.actions.map((a, i) => (
                    <ActionBtn key={i} label={a.label} onClick={() => handleSend(null, a.prompt)} disabled={isTyping} />
                  ))}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to generate a call list</span>
                </div>
              )}
            </div>
          </div>
        );
      }
    }

    return null;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)', gap: 0 }}>

      {/* ── Today's Queue Strip ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, padding: '0 0 14px 0', flexShrink: 0 }}>
        {[
          { icon: '📞', label: 'Calls Today',    value: (() => { try { const ts = JSON.parse(localStorage.getItem('calls_prospect_timestamps') || '{}'); return Object.values(ts).filter(t => new Date(t).toDateString() === new Date().toDateString()).length; } catch { return 0; } })(), sub: 'dials', action: () => navigate('/dialer'), color: 'var(--accent-primary)', bg: 'var(--accent-dim)', border: 'var(--border-accent)' },
          { icon: '🛡️', label: 'Review Queue',   value: todayStats.hitl,              sub: 'pending', action: () => navigate('/hitl'),             color: 'var(--status-warning)',  bg: 'var(--status-warning-dim)',  border: 'var(--status-warning-border)' },
          { icon: '📬', label: 'Never Called',   value: todayStats.neverCalled,        sub: 'w/ phone', action: () => navigate('/dialer'),           color: 'var(--status-success)',  bg: 'var(--status-success-dim)',  border: 'var(--status-success-border)' },
          { icon: '✉️', label: 'Enrollments',    value: todayStats.activeEnrollments,  sub: 'active', action: () => navigate('/sequence-manager'),  color: 'var(--status-info)',     bg: 'var(--status-info-dim)',     border: 'var(--status-info-border)' },
        ].map(card => (
          <button
            key={card.label}
            onClick={card.action}
            style={{
              flex: 1, minWidth: 0, textAlign: 'left',
              background: card.bg, border: `1px solid ${card.border}`,
              borderRadius: 'var(--radius-md)', padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 3,
              cursor: 'pointer', transition: 'filter 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
          >
            <span style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {card.icon} {card.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 2 }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{card.sub}</span>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 14, minHeight: 0 }}>

        {/* ── LEFT SIDEBAR: Saved Playlists ──────────────────────────────────── */}
        <div style={{ width: 220, minWidth: 220, backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Saved Playlists</span>
            {savedLists.length > 0 && <span className="count-pill">{savedLists.length}</span>}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {savedLists.length === 0 && (
              <div style={{ padding: '20px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6, opacity: 0.3 }}>📋</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                  AI-generated call lists will appear here.
                </div>
                <button
                  style={{ fontSize: '0.73rem', padding: '5px 12px' }}
                  onClick={() => handleSend(null, 'Find all uncontacted prospects and create a call list')}
                >
                  Create first list →
                </button>
              </div>
            )}
            {savedLists.map(list => (
              <div
                key={list.id}
                onClick={() => loadListEditor(list.id)}
                style={{
                  padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  backgroundColor: activeListId === list.id ? 'var(--accent-dim)' : 'transparent',
                  borderLeft: activeListId === list.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 2, color: activeListId === list.id ? 'var(--accent-secondary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {list._count?.prospects ?? 0} prospects · {new Date(list.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN BODY: Chat or List Editor ─────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: '18px 20px 14px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 14, gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.25rem', margin: 0, whiteSpace: 'nowrap' }}>Command Center</h1>
                {aiProvider && (
                  <span style={{ fontSize: '0.6rem', padding: '2px 7px', backgroundColor: 'var(--status-success-soft)', color: 'var(--status-success)', borderRadius: 10, fontWeight: 700, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {aiProvider.model || 'AI'} ACTIVE
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '3px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Ask anything about your pipeline, or build a call list instantly.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                className="ghost"
                onClick={() => {
                  setChatHistory([{ role: 'system', isWelcome: true }]);
                  setEnrollFeedback({});
                  setEnrollingListId(null);
                  setEnrollingSeqId('');
                }}
                style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                disabled={isTyping || chatHistory.length <= 1}
              >
                Clear
              </button>
              <button
                className="secondary"
                onClick={enrichDatabase}
                style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                disabled={isTyping || !!activeListId}
              >
                ✨ Enrich Data
              </button>
            </div>
          </div>

          {activeListId && activeListData ? (
            // ── LIST EDITOR VIEW ─────────────────────────────────────────────
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ marginBottom: 24 }}>
                <input
                  type="text"
                  value={activeListData.title}
                  onChange={(e) => updateListMetadata('title', e.target.value)}
                  style={{ fontSize: '1.8rem', fontWeight: 700, border: 'none', background: 'transparent', color: 'var(--text-primary)', borderBottom: '1px dashed var(--border-color)', paddingBottom: 4, width: '100%', marginBottom: 12, outline: 'none' }}
                />
                <textarea
                  value={activeListData.description || ''}
                  onChange={(e) => updateListMetadata('description', e.target.value)}
                  placeholder="List context or reasoning prompt used to generate this."
                  style={{ width: '100%', padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem', resize: 'vertical', minHeight: 60 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Enrolled Prospects ({activeListData.prospects.length})</h3>
                <button
                  className="success-btn"
                  style={{ padding: '10px 20px' }}
                  onClick={() => navigate('/dialer', { state: { prospects: activeListData.prospects } })}
                >
                  Launch in Calls
                </button>
              </div>

              <div style={{ flex: 1, backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflowY: 'auto', padding: 12 }}>
                {activeListData.prospects.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {p.companyName}{p.title ? ` · ${p.title}` : ''}{p.techStack ? ` · [${p.techStack}]` : ''}
                      </div>
                    </div>
                    <button className="danger" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => removeProspectFromList(p.id)}>
                      Remove
                    </button>
                  </div>
                ))}
                {activeListData.prospects.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>No prospects remaining.</div>
                )}
              </div>

              <button
                className="ghost"
                style={{ marginTop: 16, alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                onClick={() => setActiveListId(null)}
              >
                ← Back to Command Center
              </button>
            </div>

          ) : (
            // ── CHAT INTERFACE VIEW ──────────────────────────────────────────
            <>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingRight: 8, display: 'flex', flexDirection: 'column' }}>
                {chatHistory.map((msg, idx) => renderMessage(msg, idx))}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ display: 'flex', gap: 12, margin: '10px 0', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>✦</div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-primary)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                      ))}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 4 }}>Searching CRM…</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Input area ──────────────────────────────────────────────── */}
              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                {/* Suggested prompt chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {SUGGESTED_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      disabled={isTyping}
                      onClick={() => handleSend(null, p)}
                      style={{
                        fontSize: '0.73rem', padding: '4px 11px', fontWeight: 500,
                        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)',
                        cursor: isTyping ? 'not-allowed' : 'pointer', opacity: isTyping ? 0.5 : 1,
                        transition: 'border-color var(--transition-fast)',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { if (!isTyping) e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <form onSubmit={(e) => handleSend(e)} style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={PLACEHOLDER_CYCLE[placeholderIdx]}
                    disabled={isTyping}
                    style={{ flex: 1, minWidth: 0, padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.92rem' }}
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !input.trim()}
                    className={input.trim() ? 'success-btn' : 'secondary'}
                    style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {isTyping ? 'Working…' : 'Ask ↵'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
