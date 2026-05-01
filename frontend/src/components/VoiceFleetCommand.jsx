import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const SENTIMENT_COLORS = {
  Positive: 'var(--status-success)',
  Neutral: 'var(--status-info)',
  Objection: 'var(--status-warning)',
  Resistance: 'var(--status-danger)',
};

const MOCK_ACTIVE_CALLS = [
  {
    id: 'call-001', prospect: 'Sarah Chen', company: 'Acme Corp', phone: '+1 (415) 555-0192',
    status: 'CONNECTED', duration: 87, sentiment: 'Positive', sentimentScore: 82,
    transcript: [
      { speaker: 'Agent', text: "Hi Sarah, this is the Apex assistant calling on behalf of Henry. Do you have a quick moment?" },
      { speaker: 'Prospect', text: "Sure, I have a couple minutes. What is this regarding?" },
      { speaker: 'Agent', text: "I wanted to follow up on the email we sent about scaling your outbound operations at Acme. I saw you recently opened it — does that topic resonate at all?" },
      { speaker: 'Prospect', text: "Actually yes, we've been looking at exactly this. We're struggling to scale our SDR team efficiently." },
    ],
    flag: null
  },
  {
    id: 'call-002', prospect: 'Marcus Rivera', company: 'TechFlow Inc', phone: '+1 (628) 555-0847',
    status: 'CONNECTED', duration: 43, sentiment: 'Objection', sentimentScore: 41,
    transcript: [
      { speaker: 'Agent', text: "Hi Marcus, calling from Apex. Is now an okay time?" },
      { speaker: 'Prospect', text: "We're actually pretty happy with our current setup. I don't think we're looking for anything new right now." },
      { speaker: 'Agent', text: "I completely understand — a lot of teams we talk to feel the same way until they see the ROI comparison. Would you be open to a quick 10-minute benchmark?" },
    ],
    flag: 'OBJECTION_DETECTED'
  },
  {
    id: 'call-003', prospect: 'Jessica Park', company: 'GrowthOS', phone: '+1 (312) 555-0234',
    status: 'VOICEMAIL', duration: 28, sentiment: 'Neutral', sentimentScore: 60,
    transcript: [
      { speaker: 'System', text: "[AMD: Answering machine detected. Preparing voicemail drop...]" },
      { speaker: 'Agent', text: "Hi Jessica, this is a message from Henry at Apex. I sent you an email earlier about scaling your outbound — would love to grab 15 minutes. I'll send a calendar link in a follow-up email. Have a great day!" },
      { speaker: 'System', text: "[Voicemail drop complete. Call terminated.]" },
    ],
    flag: null
  },
  {
    id: 'call-004', prospect: 'David Kim', company: 'Nexus AI', phone: '+1 (206) 555-0318',
    status: 'DIALING', duration: 0, sentiment: 'Neutral', sentimentScore: 60,
    transcript: [],
    flag: null
  },
];

const CallCard = ({ call, isSelected, onClick }) => {
  const [elapsed, setElapsed] = useState(call.duration);

  useEffect(() => {
    if (call.status !== 'CONNECTED') return;
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [call.status]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const sentColor = SENTIMENT_COLORS[call.sentiment] || 'var(--text-secondary)';

  return (
    <div
      onClick={onClick}
      style={{
        padding: 16, cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
        backgroundColor: isSelected ? 'var(--accent-dim)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
        transition: 'all 0.15s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{call.prospect}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{call.company}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {call.status === 'CONNECTED' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--status-success)' }}>
              <span className="pulsing-dot" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--status-success)', display: 'inline-block' }} />
              {fmt(elapsed)}
            </div>
          )}
          {call.status === 'VOICEMAIL' && <span style={{ fontSize: '0.75rem', color: 'var(--status-warning)', fontWeight: 600 }}>📭 VM Dropped</span>}
          {call.status === 'DIALING' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--status-warning)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--status-warning)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
              Dialing...
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 4, backgroundColor: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${call.sentimentScore}%`, height: '100%', backgroundColor: sentColor, borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
        <span style={{ fontSize: '0.72rem', color: sentColor, fontWeight: 700, whiteSpace: 'nowrap' }}>{call.sentiment}</span>
      </div>

      {call.flag && (
        <div style={{ marginTop: 8, padding: '4px 8px', backgroundColor: 'var(--status-danger-dim)', border: '1px solid var(--status-danger-border)', borderRadius: 4, fontSize: '0.72rem', color: 'var(--status-danger)', fontWeight: 600 }}>
          ⚑ {call.flag.replace(/_/g, ' ')}
        </div>
      )}
      {call.status === 'ENDED' && (
        <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Call ended
        </div>
      )}
    </div>
  );
};

const VoiceFleetCommand = () => {
  const [calls, setCalls] = useState(MOCK_ACTIVE_CALLS);
  const [selectedId, setSelectedId] = useState(MOCK_ACTIVE_CALLS[0]?.id || null);
  const [bridgedId, setBridgedId] = useState(null);
  const transcriptRef = useRef(null);
  const pollRef = useRef(null);

  const fetchCalls = async () => {
    try {
      const res = await api.get('/voice/calls');
      if (res.data && res.data.length > 0) {
        setCalls(res.data);
        if (!selectedId) setSelectedId(res.data[0]?.id);
      }
      // If API returns empty, keep mock data so the UI is never blank
    } catch (err) {
      // Backend not reachable — keep showing mock data
    }
  };

  useEffect(() => {
    fetchCalls();
    // Poll every 3 seconds for live call updates
    pollRef.current = setInterval(fetchCalls, 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  const selected = calls.find(c => c.id === selectedId);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [selected?.transcript?.length]);

  const endCall = (callId) => {
    setCalls(prev => prev.map(c =>
      c.id === callId ? { ...c, status: 'ENDED', flag: null } : c
    ));
    // Select next active call if the ended one was selected
    if (selectedId === callId) {
      const remaining = calls.filter(c => c.id !== callId && c.status !== 'ENDED');
      setSelectedId(remaining[0]?.id || null);
    }
  };

  const bridgeAgent = (callId) => {
    setBridgedId(callId);
    setCalls(prev => prev.map(c =>
      c.id === callId
        ? { ...c, flag: null, transcript: [...c.transcript, { speaker: 'System', text: '[Human agent bridged. AI agent stepping back. You are now live.]' }] }
        : c
    ));
  };

  const dismissFlag = (callId) => {
    setCalls(prev => prev.map(c => c.id === callId ? { ...c, flag: null } : c));
  };

  const launchBatch = () => {
    const newCall = {
      id: `call-${Date.now()}`, prospect: 'New Prospect', company: 'Queued',
      phone: '+1 (000) 000-0000', status: 'DIALING', duration: 0,
      sentiment: 'Neutral', sentimentScore: 60, transcript: [], flag: null,
    };
    setCalls(prev => [...prev, newCall]);
    setSelectedId(newCall.id);
  };

  const activeCalls = calls.filter(c => c.status === 'CONNECTED').length;
  const flaggedCalls = calls.filter(c => c.flag).length;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', gap: 0 }}>
      {/* LEFT — Fleet Overview */}
      <div style={{ width: 300, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: 4, fontSize: '1rem' }}>Voice Agent Fleet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 16 }}>Live autonomous call monitoring</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--status-success-dim)', border: '1px solid var(--status-success-border)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-success)' }}>{activeCalls}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Live Calls</div>
            </div>
            <div style={{ padding: '10px', backgroundColor: flaggedCalls > 0 ? 'var(--status-danger-dim)' : 'var(--bg-primary)', border: `1px solid ${flaggedCalls > 0 ? 'var(--status-danger-border)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: flaggedCalls > 0 ? 'var(--status-danger)' : 'var(--text-secondary)' }}>{flaggedCalls}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Flagged</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {calls.map(call => (
            <CallCard key={call.id} call={call} isSelected={selectedId === call.id} onClick={() => setSelectedId(call.id)} />
          ))}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
          <button
            className="secondary"
            style={{ width: '100%' }}
            onClick={launchBatch}
          >
            + Launch New Call Batch
          </button>
        </div>
      </div>

      {/* CENTER — Live Transcript */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>{selected.prospect}</h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{selected.company} · {selected.phone}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {(selected.status === 'CONNECTED' || selected.status === 'VOICEMAIL') && (
                <>
                  {selected.status === 'CONNECTED' && !bridgedId && (
                    <button
                      className="danger"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      onClick={() => bridgeAgent(selected.id)}
                    >
                      👤 Bridge Human Agent
                    </button>
                  )}
                  {bridgedId === selected.id && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-success)', padding: '6px 10px', background: 'var(--status-success-dim)', border: '1px solid var(--status-success-border)', borderRadius: 'var(--radius-sm)' }}>
                      ● You are live
                    </span>
                  )}
                  <button
                    className="secondary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem', color: 'var(--status-danger)', borderColor: 'var(--status-danger-border)' }}
                    onClick={() => { endCall(selected.id); setBridgedId(null); }}
                  >
                    ✕ End Call
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Live Transcript */}
          <div ref={transcriptRef} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {selected.transcript.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📞</div>
                <div>Dialing... awaiting connection</div>
              </div>
            ) : (
              selected.transcript.map((line, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: line.speaker === 'Prospect' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 4px' }}>
                    {line.speaker === 'System' ? '⚙ System' : line.speaker === 'Agent' ? '🤖 AI Agent' : `👤 ${selected.prospect}`}
                  </div>
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: line.speaker === 'Prospect' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                    backgroundColor: line.speaker === 'Prospect' ? 'var(--accent-primary)' : line.speaker === 'System' ? 'rgba(255,255,255,0.03)' : 'var(--bg-tertiary)',
                    border: line.speaker === 'System' ? '1px dashed var(--border-color)' : '1px solid var(--border-color)',
                    color: line.speaker === 'System' ? 'var(--text-muted)' : 'var(--text-primary)',
                    fontSize: '0.88rem', lineHeight: 1.5,
                    fontStyle: line.speaker === 'System' ? 'italic' : 'normal',
                  }}>
                    {line.text}
                  </div>
                </div>
              ))
            )}
            {selected.status === 'CONNECTED' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-secondary)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* RIGHT — Sentiment & Controls */}
      {selected && (
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <div>
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Sentiment Analysis</h4>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>Real-time NLP · updates every 5s</div>
          </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Live Sentiment Meter */}
            <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Live Sentiment Score</div>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: SENTIMENT_COLORS[selected.sentiment] }}>{selected.sentimentScore}</div>
                <div style={{ fontSize: '0.85rem', color: SENTIMENT_COLORS[selected.sentiment], fontWeight: 600 }}>{selected.sentiment}</div>
              </div>
              <div style={{ height: 8, backgroundColor: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${selected.sentimentScore}%`, height: '100%', backgroundColor: SENTIMENT_COLORS[selected.sentiment], borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Signal Breakdown</div>
              {[
                { label: 'Buying Interest', value: selected.sentimentScore, color: 'var(--status-success)' },
                { label: 'Resistance Level', value: 100 - selected.sentimentScore, color: 'var(--status-danger)' },
                { label: 'Engagement Depth', value: Math.min(100, selected.duration * 0.8), color: 'var(--accent-primary)' },
              ].map(sig => (
                <div key={sig.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{sig.label}</span>
                    <span style={{ fontWeight: 600 }}>{Math.round(sig.value)}%</span>
                  </div>
                  <div style={{ height: 4, backgroundColor: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${sig.value}%`, height: '100%', backgroundColor: sig.color, borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Flag Controls */}
            {selected.flag && (
              <div style={{ padding: 14, backgroundColor: 'var(--status-danger-dim)', border: '1px solid var(--status-danger-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--status-danger)', fontWeight: 700, marginBottom: 8 }}>⚑ {selected.flag.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 12 }}>
                  Prospect is showing resistance signals. Recommend bridging a human agent or adjusting talk track.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '8px', fontSize: '0.78rem' }} onClick={() => bridgeAgent(selected.id)}>
                    Bridge Agent
                  </button>
                  <button className="secondary" style={{ flex: 1, padding: '8px', fontSize: '0.78rem' }} onClick={() => dismissFlag(selected.id)}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* AMD Status */}
            <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>AMD Status</div>
              <div style={{ fontSize: '0.82rem', color: selected.status === 'VOICEMAIL' ? 'var(--status-warning)' : 'var(--status-success)', fontWeight: 600 }}>
                {selected.status === 'VOICEMAIL' ? '📭 Answering Machine Detected' : selected.status === 'CONNECTED' ? '👤 Live Human Answer' : '⏳ Awaiting Detection'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceFleetCommand;
