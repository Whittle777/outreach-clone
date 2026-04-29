import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Conversation } from '@11labs/client';
import api from '../services/api';
import { useToast } from './Toast';

// ─── Audio waveform visualizer ─────────────────────────────────────────────
function Waveform({ mode, isConnected }) {
  const bars = 28;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 48 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const active = isConnected && mode === 'speaking';
        const phase = (i / bars) * Math.PI * 2;
        const base = active ? 0.35 + 0.65 * Math.abs(Math.sin(phase + Date.now() / 200)) : 0.15;
        return (
          <div
            key={i}
            style={{
              width: 3,
              borderRadius: 2,
              background: active ? 'var(--accent-primary)' : 'var(--border-color)',
              height: `${Math.max(6, base * 44)}px`,
              transition: active ? 'height 0.08s ease' : 'height 0.3s ease, background 0.3s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Animated waveform that re-renders on speaking ─────────────────────────
function LiveWaveform({ mode, isConnected }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (mode !== 'speaking' || !isConnected) return;
    const id = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(id);
  }, [mode, isConnected]);
  return <Waveform mode={mode} isConnected={isConnected} tick={tick} />;
}

// ─── Main session component ────────────────────────────────────────────────
export default function VoiceAgentSession({ signedUrl, prospect, conversationId, onEnd }) {
  const [status, setStatus]       = useState('connecting'); // connecting | connected | disconnected
  const [mode, setMode]           = useState('listening');  // speaking | listening
  const [transcript, setTranscript] = useState([]);
  const [timer, setTimer]         = useState(0);
  const [isMuted, setIsMuted]     = useState(false);
  const [outcome, setOutcome]     = useState('');
  const [showOutcome, setShowOutcome] = useState(false);
  const [saving, setSaving]       = useState(false);

  const convRef      = useRef(null);
  const timerRef     = useRef(null);
  const transcriptRef = useRef(null);
  const toast = useToast();

  // ── Start session ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const conv = await Conversation.startSession({
          signedUrl,
          onConnect: () => {
            if (!mounted) return;
            setStatus('connected');
            timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
          },
          onDisconnect: () => {
            if (!mounted) return;
            setStatus('disconnected');
            clearInterval(timerRef.current);
            setShowOutcome(true);
          },
          onMessage: ({ message, source }) => {
            if (!mounted) return;
            setTranscript(prev => [...prev, { role: source, message, ts: Date.now() }]);
          },
          onStatusChange: ({ status: s }) => {
            if (!mounted) return;
            if (s === 'connected') setStatus('connected');
            if (s === 'disconnected' || s === 'disconnecting') setStatus('disconnected');
          },
          onModeChange: ({ mode: m }) => {
            if (mounted) setMode(m === 'speaking' ? 'speaking' : 'listening');
          },
          onError: (err) => {
            console.error('ElevenLabs error:', err);
            if (mounted) toast('Voice session error — check console', 'error');
          },
        });
        if (mounted) convRef.current = conv;
      } catch (err) {
        console.error('Failed to start session:', err);
        if (mounted) {
          toast(err.message || 'Failed to connect voice session', 'error');
          setStatus('disconnected');
          setShowOutcome(true);
        }
      }
    };

    start();
    return () => {
      mounted = false;
      clearInterval(timerRef.current);
      convRef.current?.endSession().catch(() => {});
    };
  }, [signedUrl]);

  // ── Auto-scroll transcript ─────────────────────────────────────────────────
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleEndCall = useCallback(async () => {
    clearInterval(timerRef.current);
    try { await convRef.current?.endSession(); } catch {}
    setStatus('disconnected');
    setShowOutcome(true);
  }, []);

  const handleMute = useCallback(async () => {
    try {
      await convRef.current?.setVolume({ volume: isMuted ? 1 : 0 });
      setIsMuted(m => !m);
    } catch {}
  }, [isMuted]);

  const handleSaveAndClose = async () => {
    setSaving(true);
    try {
      if (prospect?.id && transcript.length > 0) {
        await api.post('/voice-agent/transcript', {
          prospectId: prospect.id,
          transcript,
          duration: timer,
          outcome: outcome || null,
          conversationId,
        });
        toast('Call saved to prospect record', 'success');
      }
    } catch {
      toast('Failed to save transcript', 'error');
    } finally {
      setSaving(false);
      onEnd(transcript, timer, outcome);
    }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const OUTCOMES = ['Connected — Meeting Booked', 'Connected — Follow-up Needed', 'Connected — Not Interested', 'Left Voicemail', 'No Answer', 'Bad Number'];

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>

      {/* ── Header / prospect strip ─────────────────────────────────────── */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color)',
        background: 'linear-gradient(180deg, var(--accent-dim) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--grad-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.9rem', color: '#fff',
            boxShadow: 'var(--shadow-glow-sm)', flexShrink: 0,
          }}>
            {prospect ? `${prospect.name?.[0] || '?'}` : '?'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {prospect?.name || 'Unknown Prospect'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {[prospect?.title, prospect?.company].filter(Boolean).join(' · ') || 'No details'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            background: status === 'connected' ? 'var(--status-success-dim)' : status === 'connecting' ? 'var(--accent-dim)' : 'var(--bg-elevated)',
            border: `1px solid ${status === 'connected' ? 'var(--status-success-border)' : status === 'connecting' ? 'var(--border-accent)' : 'var(--border-color)'}`,
            fontSize: '0.75rem', fontWeight: 700,
            color: status === 'connected' ? 'var(--status-success)' : status === 'connecting' ? 'var(--accent-secondary)' : 'var(--text-muted)',
          }}>
            {status === 'connected' && <span className="pulsing-dot" style={{ width: 7, height: 7 }} />}
            {status === 'connecting' && <span style={{ fontSize: '0.7rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>}
            {status === 'disconnected' && '●'}
            {status === 'connected' ? (mode === 'speaking' ? 'AI Speaking' : 'Listening') : status === 'connecting' ? 'Connecting…' : 'Call Ended'}
          </div>

          {/* Timer */}
          <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', minWidth: 56, textAlign: 'center' }}>
            {fmt(timer)}
          </div>
        </div>
      </div>

      {/* ── Waveform / active call display ─────────────────────────────── */}
      {!showOutcome && (
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          flexShrink: 0,
          background: 'var(--bg-secondary)',
        }}>
          <LiveWaveform mode={mode} isConnected={status === 'connected'} />

          {/* Mode label */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {status === 'connecting' ? 'Establishing connection…' :
             status === 'disconnected' ? 'Call ended' :
             mode === 'speaking' ? '🎙 Agent speaking' : '👂 Listening to prospect'}
          </div>

          {/* Call controls */}
          {status === 'connected' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleMute}
                className={isMuted ? 'secondary' : 'ghost'}
                style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
              >
                {isMuted ? '🔇 Muted' : '🎤 Mute'}
              </button>
              <button
                onClick={handleEndCall}
                className="danger"
                style={{ padding: '8px 20px', fontSize: '0.82rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}
              >
                ✕ End Call
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Live transcript ─────────────────────────────────────────────── */}
      <div
        ref={transcriptRef}
        style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {transcript.length === 0 && status === 'connected' && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 24 }}>
            Transcript will appear here as the conversation unfolds…
          </div>
        )}
        {transcript.map((t, i) => {
          const isAI = t.role === 'agent' || t.role === 'ai';
          return (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: isAI ? 'flex-start' : 'flex-end' }}>
              {isAI && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0, marginTop: 2 }}>
                  🤖
                </div>
              )}
              <div style={{
                maxWidth: '74%',
                padding: '9px 13px',
                borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                background: isAI ? 'var(--bg-elevated)' : 'var(--grad-button)',
                border: isAI ? '1px solid var(--border-color)' : 'none',
                color: isAI ? 'var(--text-primary)' : '#fff',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}>
                {t.message}
              </div>
              {!isAI && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 2 }}>
                  {prospect?.name?.[0] || 'P'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Post-call outcome panel ─────────────────────────────────────── */}
      {showOutcome && (
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
            Log call outcome
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {OUTCOMES.map(o => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                className={outcome === o ? '' : 'secondary'}
                style={{ fontSize: '0.75rem', padding: '5px 12px', borderRadius: 'var(--radius-full)' }}
              >
                {o}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSaveAndClose}
              disabled={saving}
              style={{ flex: 1, padding: '10px' }}
            >
              {saving ? 'Saving…' : prospect?.id ? '💾 Save to CRM & Close' : 'Close'}
            </button>
            <button className="ghost" onClick={() => onEnd(transcript, timer, outcome)} style={{ padding: '10px 16px' }}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
