import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from './Toast';
import VoiceAgentSession from './VoiceAgentSession';

const DEFAULT_TEMPLATE = `You are a professional SDR making an outbound sales call on behalf of the team. You are warm, concise, and focused on booking a discovery meeting.

Prospect context:
- Name: {{firstName}} {{lastName}}
- Title: {{title}}
- Company: {{company}}
- Status: {{status}}
- Notes: {{notes}}

Your goal: qualify the prospect and book a 20-minute discovery call. Handle objections gracefully. If they express no interest, thank them politely and end the call. Keep each response under 3 sentences.`;

// ─── Setup checklist item ─────────────────────────────────────────────────
function CheckItem({ ok, label, sub, action, actionLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: ok ? 'var(--status-success-dim)' : 'var(--bg-elevated)',
        border: `1px solid ${ok ? 'var(--status-success-border)' : 'var(--border-color)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', color: ok ? 'var(--status-success)' : 'var(--text-muted)',
      }}>
        {ok ? '✓' : '○'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: ok ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {!ok && action && (
        <button className="secondary" style={{ fontSize: '0.75rem', padding: '4px 12px', flexShrink: 0 }} onClick={action}>
          {actionLabel || 'Configure'}
        </button>
      )}
    </div>
  );
}

// ─── Prospect search / picker ─────────────────────────────────────────────
function ProspectPicker({ onSelect, onClose }) {
  const [q, setQ] = useState('');
  const [prospects, setProspects] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/prospects').then(r => setProspects(r.data || [])).catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const filtered = q.length > 0
    ? prospects.filter(p => `${p.firstName} ${p.lastName} ${p.companyName || ''} ${p.email}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : prospects.slice(0, 6);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 540, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>🔍</span>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search prospects by name, company, email…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem', color: 'var(--text-primary)' }}
          />
          <button className="ghost" onClick={onClose} style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: '1rem' }}>✕</button>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '28px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No results</div>
          )}
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-dim)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#fff', flexShrink: 0 }}>
                {p.firstName?.[0]}{p.lastName?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.firstName} {p.lastName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[p.title, p.companyName].filter(Boolean).join(' · ') || p.email}
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                {p.status || 'Uncontacted'}
              </span>
            </button>
          ))}
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={() => onSelect(null)} className="secondary" style={{ width: '100%', padding: '9px', fontSize: '0.82rem' }}>
            Start without prospect context
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function VoiceAgentLanding() {
  const [creds, setCreds]               = useState({ eleven: false, claude: false });
  const [agentId, setAgentId]           = useState(null);
  const [voices, setVoices]             = useState([]);
  const [recentCalls, setRecentCalls]   = useState([]);
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_TEMPLATE);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [showPicker, setShowPicker]     = useState(false);

  // Active session state
  const [session, setSession] = useState(null); // { signedUrl, prospect, conversationId }
  const [sessionActive, setSessionActive] = useState(false);

  const toast = useToast();

  useEffect(() => {
    // Check which integrations are connected
    api.get('/integrations').then(r => {
      const list = r.data || [];
      const eleven = list.find(i => i.provider === 'elevenlabs');
      const claude = list.find(i => i.provider === 'claude');
      setCreds({ eleven: !!eleven?.clientId, claude: !!claude?.clientId });
      if (eleven?.clientSecret) setAgentId(eleven.clientSecret);
    }).catch(() => {});

    // Load voices if ElevenLabs is connected
    api.get('/voice-agent/voices').then(r => setVoices(r.data || [])).catch(() => {});

    // Load recent calls
    api.get('/voice-agent/calls').then(r => setRecentCalls(r.data || [])).catch(() => {});
  }, []);

  const handleProvision = async () => {
    setProvisioning(true);
    try {
      const r = await api.post('/voice-agent/provision');
      setAgentId(r.data.agentId);
      toast('Voice agent activated', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Provisioning failed', 'error');
    } finally {
      setProvisioning(false);
    }
  };

  const handleStartCall = async (prospect) => {
    setShowPicker(false);
    try {
      const r = await api.post('/voice-agent/session', {
        prospectId: prospect?.id || null,
        promptTemplate,
      });
      setSession({ ...r.data });
      setSessionActive(true);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to start session', 'error');
    }
  };

  const handleSessionEnd = (transcript, duration, outcome) => {
    setSessionActive(false);
    setSession(null);
    // Refresh recent calls
    api.get('/voice-agent/calls').then(r => setRecentCalls(r.data || [])).catch(() => {});
    if (transcript.length > 0) {
      toast(`Call ended — ${duration}s · ${transcript.length} turns`, 'info');
    }
  };

  const canStart = creds.eleven && agentId;

  // ── Active session overlay ─────────────────────────────────────────────
  if (sessionActive && session) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
        <VoiceAgentSession
          signedUrl={session.signedUrl}
          prospect={session.prospect}
          conversationId={session.conversationId}
          onEnd={handleSessionEnd}
        />
      </div>
    );
  }

  // ── Landing page ──────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Voice Agent</h1>
            <span style={{ fontSize: '0.62rem', padding: '3px 8px', background: 'var(--status-warning-dim)', color: 'var(--status-warning)', border: '1px solid var(--status-warning-border)', borderRadius: 'var(--radius-full)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Beta
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            AI-powered outbound calls using ElevenLabs voice synthesis and Claude reasoning.
            Real-time transcripts saved automatically to prospect records.
          </p>
        </div>
        <button
          onClick={() => canStart ? setShowPicker(true) : toast('Complete setup below before starting a call', 'warning')}
          disabled={!canStart}
          style={{ padding: '11px 22px', fontSize: '0.92rem', fontWeight: 700, flexShrink: 0, marginTop: 4, opacity: canStart ? 1 : 0.4 }}
        >
          🎙 Start Call
        </button>
      </div>

      {/* Setup checklist */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '0 20px' }}>
        <div style={{ padding: '14px 0 10px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Setup
        </div>
        <CheckItem
          ok={creds.eleven}
          label="ElevenLabs API key"
          sub="Required for voice synthesis and STT"
          action={() => window.location.hash = '#/integrations'}
          actionLabel="→ Integrations"
        />
        <CheckItem
          ok={creds.claude}
          label="Anthropic Claude API key"
          sub="Powers reasoning and objection handling"
          action={() => window.location.hash = '#/integrations'}
          actionLabel="→ Integrations"
        />
        <CheckItem
          ok={!!agentId}
          label="Voice agent provisioned"
          sub={agentId ? `Agent ID: ${agentId}` : 'Creates your ElevenLabs Conversational AI agent'}
          action={creds.eleven ? handleProvision : null}
          actionLabel={provisioning ? 'Activating…' : 'Activate Agent'}
        />
        <div style={{ height: 6 }} />
      </div>

      {/* Two-column: voices + prompt */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Voice selector */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Voice
          </div>
          {voices.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {creds.eleven ? 'Loading voices…' : 'Connect ElevenLabs to browse voices'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {voices.slice(0, 12).map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.88rem' }}>🎙</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{v.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{v.category}</div>
                  </div>
                  {v.preview && (
                    <button className="ghost" style={{ padding: '3px 8px', fontSize: '0.7rem' }} onClick={() => new Audio(v.preview).play()}>▶</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
            Voice is configured in your ElevenLabs dashboard. Agent uses the voice set during provisioning.
          </p>
        </div>

        {/* System prompt template */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Agent Prompt Template
            </div>
            <button className="ghost" style={{ fontSize: '0.72rem', padding: '2px 8px' }} onClick={() => setEditingPrompt(e => !e)}>
              {editingPrompt ? 'Done' : '✎ Edit'}
            </button>
          </div>
          {editingPrompt ? (
            <textarea
              value={promptTemplate}
              onChange={e => setPromptTemplate(e.target.value)}
              style={{ flex: 1, minHeight: 200, fontSize: '0.78rem', lineHeight: 1.6, fontFamily: 'monospace', resize: 'vertical' }}
            />
          ) : (
            <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 220, overflowY: 'auto', margin: 0 }}>
              {promptTemplate}
            </pre>
          )}
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Use {'{{firstName}}'}, {'{{lastName}}'}, {'{{company}}'}, {'{{title}}'}, {'{{status}}'}, {'{{notes}}'} — replaced per call.
          </p>
        </div>
      </div>

      {/* Custom LLM info */}
      <div className="info-banner" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 2 }}>⚡</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: 4 }}>Custom LLM endpoint available</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Point your ElevenLabs agent's custom LLM to <code>{window.location.origin.replace('5174', '3000')}/voice-agent/llm</code> to use Claude with live CRM context injection. Requires a publicly accessible server (use ngrok in local dev).
          </div>
        </div>
      </div>

      {/* Recent calls */}
      {recentCalls.length > 0 && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Recent Calls
          </div>
          <table>
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Company</th>
                <th>Outcome</th>
                <th>Duration</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.slice(0, 10).map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{c.prospectName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.company || '—'}</td>
                  <td>
                    {c.outcome ? (
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: c.outcome.includes('Booked') ? 'var(--status-success-dim)' : 'var(--bg-tertiary)', color: c.outcome.includes('Booked') ? 'var(--status-success)' : 'var(--text-muted)', border: `1px solid ${c.outcome.includes('Booked') ? 'var(--status-success-border)' : 'var(--border-subtle)'}` }}>
                        {c.outcome}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {Math.floor(c.duration / 60)}:{String(c.duration % 60).padStart(2, '0')}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Prospect picker modal */}
      {showPicker && <ProspectPicker onSelect={handleStartCall} onClose={() => setShowPicker(false)} />}
    </div>
  );
}
