import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from './Toast';
import { useIntegrations } from '../contexts/IntegrationContext';
import { SetupTooltipBlock } from './SetupTooltip';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

// E.164 country-code prefixes that map to Americas timezones.
// Listed longest-first so AMERICAS_PREFIXES.some(startsWith) matches the most
// specific code (e.g. '593' before '5') without needing a sorted search.
const AMERICAS_PREFIXES = ['593','591','595','598','592','597','507','506','502','504','505','503','52','55','54','57','56','51','58','1'];

// ─── localStorage keys ────────────────────────────────────
// Centralised here so any rename propagates across all read/write sites.
// App.jsx and Dashboard.jsx import CALL_TS_KEY by convention (not module
// import) — keep names in sync if you ever rename them.
const CALL_HISTORY_KEY  = 'calls_session_history';  // array of past call sessions
const CALL_TS_KEY       = 'calls_prospect_timestamps'; // { [prospectId]: epochMs }
const VM_RECORDINGS_KEY = 'calls_vm_recordings';    // array of { id, name, duration, audioDataUrl }
const VM_HISTORY_KEY    = 'calls_vm_history';       // { [prospectId]: vmId[] } — tracks which VMs were left

// ─── Timing delays (ms) ──────────────────────────────────
// Simulated latency between clicking "Dial" and the call showing as CONNECTED.
// In production these transitions come from MS Graph API webhooks via WebSocket.
const DIALING_CONNECT_DELAY_MS = 1200; // Manual & Sequential: DIALING → CONNECTED
const POWER_CONNECT_DELAY_MS   = 1800; // Power mode: slot filled → CONNECTED

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

const formatRelative = (ts) => {
  if (!ts) return 'Never';
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d/60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

const getTeamsLink = (p) => {
  const phone = p?.trackingPixelData?.phone || p?.phone;
  if (!phone) return null;
  return `https://teams.microsoft.com/l/call/0/0?users=4:+${phone.replace(/\D/g,'')}`;
};

const getPhoneDigits = (p) => {
  const phone = p?.trackingPixelData?.phone || p?.phone;
  return phone ? phone.replace(/\D/g,'') : null;
};

const isAmericas = (p) => {
  const d = getPhoneDigits(p);
  if (!d) return false;
  return AMERICAS_PREFIXES.some(c => d.startsWith(c));
};

// ─── localStorage helpers ───────────────────────────────
// Thin wrapper that swallows JSON parse/stringify errors and localStorage quota
// errors (common when audio dataURLs grow large). All callers receive a safe
// fallback value instead of throwing. Keys must match the constants above.
const ls = {
  get: (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { console.warn('localStorage write failed — storage may be full'); } },
};

// Read / write call timestamps (used by App.jsx sidebar & Dashboard today-strip)
const getCallTs        = ()           => ls.get(CALL_TS_KEY, {});
const setCallTs        = (id)         => { const t = getCallTs(); t[String(id)] = Date.now(); ls.set(CALL_TS_KEY, t); };

const getSessionHist   = ()           => ls.get(CALL_HISTORY_KEY, []);

// VM recordings are stored as base64 dataURLs so they survive page refreshes.
// A 30-second webm recording is ~150 KB as base64; localStorage allows ~5 MB,
// so expect room for roughly 30 recordings before writes start failing silently.
const getVmRecordings  = ()           => ls.get(VM_RECORDINGS_KEY, []);
const saveVmRecordings = (arr)        => ls.set(VM_RECORDINGS_KEY, arr);

const getVmHistory     = ()           => ls.get(VM_HISTORY_KEY, {});
// Append vmId to the list of VMs already left for this prospect
const recordVmDropped  = (pid, vmId) => { const h = getVmHistory(); h[String(pid)] = [...(h[String(pid)]||[]), vmId]; ls.set(VM_HISTORY_KEY, h); };

// Return the next recording in the ordered list that has NOT yet been left for
// this prospect. Uses a Set for O(1) lookup against the used-ID array.
// Returns null when all recordings have been used (caller skips the VM drop).
const getNextVm = (prospectId, recordings) => {
  const used = new Set(getVmHistory()[String(prospectId)] || []);
  return recordings.find(r => !used.has(r.id)) || null;
};

// Persist a completed session so it appears in "Previous Sessions" smart lists.
// De-duplicates by label (keeps only the most recent run of a same-named list)
// and caps history at 20 entries to keep localStorage usage bounded.
const saveSession = (label, prospects) => {
  const hist = getSessionHist().filter(s => s.label !== label).slice(0, 19);
  ls.set(CALL_HISTORY_KEY, [{ id: Date.now(), label, savedAt: Date.now(), prospectIds: prospects.map(p=>p.id), count: prospects.length }, ...hist]);
};

// ─────────────────────────────────────────────────────────
// Smart list builder
// ─────────────────────────────────────────────────────────
// Derives pre-built call queues from the prospect/sequence/history data already
// in memory. Runs client-side — no extra API calls. Lists are ordered to surface
// the highest-value calls first in each category.
const buildSmartLists = (allProspects, sequences) => {
  const callTs = getCallTs();
  // null timestamp = never called; treated as "oldest" so they sort to the top
  const getTs  = (p) => callTs[String(p.id)] || null;
  const lists  = [];

  const americas = allProspects.filter(isAmericas).sort((a,b) => { const ta=getTs(a),tb=getTs(b); if(!ta&&!tb)return 0; if(!ta)return -1; if(!tb)return 1; return ta-tb; });
  if (americas.length) lists.push({ id:'americas_lrc', icon:'🌎', title:'Americas — Least Recently Called', desc:`${americas.length} contacts with Americas phone codes, sorted by last called`, tag:'Smart', tagColor:'var(--accent-primary)', prospects:americas });

  const never = allProspects.filter(p => getPhoneDigits(p) && !getTs(p));
  if (never.length) lists.push({ id:'never_called', icon:'🆕', title:'Never Called', desc:`${never.length} prospects with a phone number not yet dialed`, tag:'Smart', tagColor:'var(--status-success)', prospects:never });

  sequences.forEach(seq => {
    const activeIds = new Set(
      (seq.prospectEnrollments || []).filter(e => e.status === 'active').map(e => e.prospect?.id).filter(Boolean)
    );
    const enrolled = allProspects.filter(p => activeIds.has(p.id) && getPhoneDigits(p));
    if (enrolled.length) lists.push({ id:`seq_${seq.id}`, icon:'✉️', title:`Sequence: ${seq.name}`, desc:`${enrolled.length} active — call to complement the email cadence`, tag:'Sequence', tagColor:'var(--status-info)', prospects:enrolled });
  });

  getSessionHist().sort((a,b)=>a.savedAt-b.savedAt).forEach(session => {
    const resolved = session.prospectIds.map(id=>allProspects.find(p=>p.id===id)).filter(Boolean);
    if (resolved.length) lists.push({ id:`session_${session.id}`, icon:'🕐', title:session.label, desc:`${resolved.length} contacts · Last run ${formatRelative(session.savedAt)}`, tag:'History', tagColor:'var(--text-muted)', prospects:resolved, savedAt:session.savedAt });
  });

  return lists;
};

// ─────────────────────────────────────────────────────────
// VM Manager Panel
// ─────────────────────────────────────────────────────────
const VMManager = ({ onClose }) => {
  const [recordings, setRecordings]     = useState(getVmRecordings);
  const [isRecording, setIsRecording]   = useState(false);
  const [recTime, setRecTime]           = useState(0);
  const [playingId, setPlayingId]       = useState(null);
  const [newName, setNewName]           = useState('');
  const [editId, setEditId]             = useState(null);
  const [editName, setEditName]         = useState('');
  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const audioRefs   = useRef({});
  const streamRef   = useRef(null);

  const persist = (recs) => { setRecordings(recs); saveVmRecordings(recs); };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = e => { if (e.data.size>0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type:'audio/webm' });
        // Convert to a base64 dataURL so it can be JSON-serialised into
        // localStorage and survive page refreshes without a server upload.
        // See the getVmRecordings() comment above for storage size guidance.
        const reader = new FileReader();
        reader.onloadend = () => {
          const recs = getVmRecordings();
          persist([...recs, { id: Date.now(), name: newName.trim() || `Voicemail ${recs.length+1}`, duration: recTime, audioDataUrl: reader.result, createdAt: Date.now() }]);
          setNewName(''); setRecTime(0);
        };
        reader.readAsDataURL(blob);
        streamRef.current?.getTracks().forEach(t => t.stop());
      };
      mediaRef.current = rec;
      rec.start();
      setIsRecording(true); setRecTime(0);
      timerRef.current = setInterval(() => setRecTime(t=>t+1), 1000);
    } catch {
      alert('Microphone access denied. Please allow microphone access to record voicemails.');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setIsRecording(false);
  };

  const togglePlay = (rec) => {
    if (playingId === rec.id) { audioRefs.current[rec.id]?.pause(); setPlayingId(null); return; }
    if (playingId) audioRefs.current[playingId]?.pause();
    if (!audioRefs.current[rec.id]) {
      audioRefs.current[rec.id] = new Audio(rec.audioDataUrl);
      audioRefs.current[rec.id].onended = () => setPlayingId(null);
    }
    audioRefs.current[rec.id].currentTime = 0;
    audioRefs.current[rec.id].play();
    setPlayingId(rec.id);
  };

  const move = (idx, dir) => {
    const arr = [...recordings];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    persist(arr);
  };

  const vmHistory = getVmHistory();

  return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, width:420, background:'var(--bg-secondary)', borderLeft:'1px solid var(--border-color)', zIndex:210, display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.5)' }}>
      <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h3 style={{ margin:0 }}>Voicemail Recordings</h3>
          <p style={{ margin:'4px 0 0', fontSize:'0.78rem', color:'var(--text-secondary)' }}>Ordered list — next unused is auto-dropped per prospect in Sequential/Power</p>
        </div>
        <button className="ghost" style={{ padding:'4px 10px' }} onClick={onClose}>✕</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:8 }}>
        {recordings.length === 0 && !isRecording && (
          <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'24px 0', fontSize:'0.88rem' }}>
            No recordings yet. Record your first voicemail below.
          </div>
        )}
        {recordings.map((rec, idx) => {
          const usedForCount = Object.values(vmHistory).filter(arr => arr.includes(rec.id)).length;
          const isPlaying    = playingId === rec.id;
          const isEditing    = editId === rec.id;
          return (
            <div key={rec.id} style={{ display:'flex', alignItems:'center', gap:10, padding:12, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--accent-primary)', color:'#fff', fontSize:'0.72rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {idx+1}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                {isEditing ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={e=>setEditName(e.target.value)}
                    onBlur={() => { persist(recordings.map(r=>r.id===rec.id?{...r,name:editName.trim()||r.name}:r)); setEditId(null); }}
                    onKeyDown={e=>{ if(e.key==='Enter'||e.key==='Escape'){ persist(recordings.map(r=>r.id===rec.id?{...r,name:editName.trim()||r.name}:r)); setEditId(null); }}}
                    style={{ background:'var(--bg-primary)', border:'1px solid var(--accent-primary)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)', padding:'3px 8px', fontSize:'0.88rem', width:'100%' }}
                  />
                ) : (
                  <div style={{ fontWeight:600, fontSize:'0.88rem', color:'var(--text-primary)', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
                    onClick={() => { setEditId(rec.id); setEditName(rec.name); }}>
                    {rec.name}
                    <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>✏</span>
                  </div>
                )}
                <div style={{ fontSize:'0.74rem', color:'var(--text-muted)', marginTop:3, display:'flex', gap:10 }}>
                  <span>{formatTime(rec.duration)}</span>
                  <span>·</span>
                  <span>Used for {usedForCount} prospect{usedForCount!==1?'s':''}</span>
                </div>
              </div>
              <button className="ghost" style={{ padding:'5px 9px', fontSize:'1rem' }} title={isPlaying?'Pause':'Play'} onClick={()=>togglePlay(rec)}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <button className="ghost" style={{ padding:'2px 6px', fontSize:'0.65rem', opacity:idx===0?0.25:1 }} onClick={()=>move(idx,-1)} disabled={idx===0}>▲</button>
                <button className="ghost" style={{ padding:'2px 6px', fontSize:'0.65rem', opacity:idx===recordings.length-1?0.25:1 }} onClick={()=>move(idx,1)} disabled={idx===recordings.length-1}>▼</button>
              </div>
              <button className="danger" style={{ padding:'5px 8px', fontSize:'0.78rem', flexShrink:0 }} onClick={()=>{ if(playingId===rec.id){audioRefs.current[rec.id]?.pause();setPlayingId(null);} persist(recordings.filter(r=>r.id!==rec.id)); }}>
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ padding:20, borderTop:'1px solid var(--border-color)', background:'var(--bg-primary)' }}>
        {isRecording ? (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', backgroundColor:'var(--status-danger)', boxShadow:'0 0 6px var(--status-danger)', flexShrink:0 }} className="pulsing-dot" />
              <span style={{ fontWeight:700, color:'var(--status-danger)', fontFamily:'monospace', fontSize:'1.05rem' }}>{formatTime(recTime)}</span>
              <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>Recording…</span>
            </div>
            <button className="danger" style={{ padding:'10px 20px', fontWeight:700, flexShrink:0 }} onClick={stopRecording}>
              ⏹ Stop & Save
            </button>
          </div>
        ) : (
          <>
            <input
              type="text" placeholder="Recording name (optional)"
              value={newName} onChange={e=>setNewName(e.target.value)}
              style={{ width:'100%', background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)', padding:'8px 10px', fontSize:'0.85rem', marginBottom:10, boxSizing:'border-box' }}
            />
            <button className="success-btn" style={{ width:'100%', padding:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }} onClick={startRecording}>
              🎙 Record New Voicemail
            </button>
          </>
        )}
        <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', margin:'10px 0 0' }}>
          Keep VMs under 30 seconds. The next unused recording in order is automatically selected per prospect — no duplicates will be left.
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Settings Panel
// ─────────────────────────────────────────────────────────
const SettingsPanel = ({ settings, onChange, onClose }) => (
  <div style={{ position:'fixed', top:0, right:0, bottom:0, width:360, background:'var(--bg-secondary)', borderLeft:'1px solid var(--border-color)', zIndex:200, display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.4)' }}>
    <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <h3 style={{ margin:0 }}>Call Settings</h3>
      <button className="ghost" style={{ padding:'4px 10px' }} onClick={onClose}>✕</button>
    </div>
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20, overflowY:'auto', flex:1 }}>
      <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontWeight:600, fontSize:'0.9rem' }}>Drop Voicemail</div>
          <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:2 }}>Auto-drop next unused recording on no answer (Sequential/Power)</div>
        </div>
        <input type="checkbox" checked={settings.vmDrop} onChange={e=>onChange({...settings,vmDrop:e.target.checked})} style={{ width:18, height:18, cursor:'pointer' }} />
      </label>
      <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ fontWeight:600, fontSize:'0.9rem' }}>Concurrent Lines <span style={{ color:'var(--accent-primary)', fontWeight:400 }}>(Power mode)</span></div>
        <input type="number" min={1} max={10} value={settings.concurrentLines} onChange={e=>onChange({...settings,concurrentLines:Math.max(1,Math.min(10,+e.target.value))})}
          style={{ background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)', padding:'8px 10px', width:80 }} />
      </label>
      <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ fontWeight:600, fontSize:'0.9rem' }}>Delay Between Calls <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(seconds)</span></div>
        <input type="number" min={0} max={60} value={settings.delaySeconds} onChange={e=>onChange({...settings,delaySeconds:Math.max(0,+e.target.value)})}
          style={{ background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-sm)', color:'var(--text-primary)', padding:'8px 10px', width:80 }} />
      </label>
      <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontWeight:600, fontSize:'0.9rem' }}>Call Recording</div>
          <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:2 }}>Saves recordings to your account</div>
        </div>
        <input type="checkbox" checked={settings.callRecording} onChange={e=>onChange({...settings,callRecording:e.target.checked})} style={{ width:18, height:18, cursor:'pointer' }} />
      </label>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// Shared session sub-components
// ─────────────────────────────────────────────────────────
const SmartListCard = ({ list, selected, onSelect }) => (
  <button onClick={()=>onSelect(list)} style={{ flexShrink:0, width:250, background:selected?'var(--accent-dim)':'var(--bg-tertiary)', border:`1px solid ${selected?'var(--accent-primary)':'var(--border-color)'}`, boxShadow:selected?'0 0 0 1px var(--accent-primary)':'none', borderRadius:'var(--radius-md)', padding:'12px 14px', textAlign:'left', cursor:'pointer', transition:'all 0.18s ease' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
      <span style={{ fontSize:'1.1rem' }}>{list.icon}</span>
      <span style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:list.tagColor, background:`${list.tagColor}22`, border:`1px solid ${list.tagColor}44`, padding:'1px 6px', borderRadius:'var(--radius-full)', flexShrink:0 }}>{list.tag}</span>
    </div>
    <div style={{ fontWeight:700, fontSize:'0.84rem', color:'var(--text-primary)', marginBottom:4, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{list.title}</div>
    <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{list.desc}</div>
    <div style={{ marginTop:10 }}>
      <span style={{ fontSize:'0.78rem', fontWeight:700, color:selected?'var(--accent-primary)':'var(--text-primary)', background:'var(--bg-primary)', padding:'2px 8px', borderRadius:'var(--radius-full)', border:'1px solid var(--border-color)' }}>
        {list.prospects.length} contacts
      </span>
    </div>
  </button>
);

const ModeCard = ({ icon, title, desc, onSelect, disabled }) => (
  <button onClick={onSelect} disabled={disabled} style={{ background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'18px 16px', textAlign:'left', cursor:disabled?'not-allowed':'pointer', transition:'border-color 0.2s, box-shadow 0.2s', width:'100%', opacity:disabled?0.45:1 }}
    onMouseEnter={e=>{ if(!disabled){e.currentTarget.style.borderColor='var(--accent-primary)';e.currentTarget.style.boxShadow='0 0 0 1px var(--accent-primary)';} }}
    onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-color)';e.currentTarget.style.boxShadow='none'; }}>
    <div style={{ fontSize:'1.3rem', marginBottom:6 }}>{icon}</div>
    <div style={{ fontWeight:700, fontSize:'0.92rem', marginBottom:4, color:'var(--text-primary)' }}>{title}</div>
    <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{desc}</div>
  </button>
);

const OUTCOME_STYLES = {
  'Connected':      { bg:'var(--status-success-dim)',  border:'var(--status-success-border)', color:'var(--status-success)', icon:'✅' },
  'Left Voicemail': { bg:'var(--status-info-dim)',     border:'var(--status-info-border)',    color:'var(--status-info)',    icon:'🔊' },
  'No Answer':      { bg:'rgba(100,116,139,0.08)',     border:'rgba(100,116,139,0.2)',        color:'var(--text-secondary)', icon:'🚫' },
  'Bad Number':     { bg:'var(--status-warning-dim)',  border:'var(--status-warning-border)', color:'var(--status-warning)', icon:'⚠️' },
};

const OutcomeButtons = ({ onLog, callNote, onNoteChange }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Log Outcome</div>
    <textarea
      value={callNote}
      onChange={(e) => onNoteChange(e.target.value)}
      placeholder="Call notes… (optional)"
      rows={3}
      style={{ width:'100%', resize:'vertical', fontSize:'0.83rem', padding:'8px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-color)', background:'var(--bg-tertiary)', color:'var(--text-primary)', fontFamily:'inherit', marginBottom:4, boxSizing:'border-box' }}
    />
    {[['Connected & Pitched','Connected'],['Left Voicemail','Left Voicemail'],['No Answer','No Answer'],['Bad Number','Bad Number']].map(([label,val])=>{
      const s = OUTCOME_STYLES[val];
      return (
        <button
          key={val}
          onClick={()=>onLog(val, callNote)}
          style={{ fontSize:'0.82rem', padding:'8px 12px', textAlign:'left', background:s.bg, border:`1px solid ${s.border}`, borderRadius:'var(--radius-sm)', color:s.color, cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontWeight:600, transition:'opacity 0.15s', whiteSpace:'nowrap', width:'100%' }}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.8'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}
        >
          <span style={{ flexShrink:0 }}>{s.icon}</span><span>{label}</span>
        </button>
      );
    })}
  </div>
);

const ProspectHeader = ({ prospect, callStatus, timer }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
    <div>
      <h2 style={{ marginBottom:4 }}>{prospect.firstName} {prospect.lastName}</h2>
      <div style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{prospect.companyName || prospect.company} · {prospect.email}</div>
      {getTeamsLink(prospect) && (
        <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontFamily:'monospace' }}>{prospect.trackingPixelData?.phone||prospect.phone}</span>
          <a href={getTeamsLink(prospect)} target="_blank" rel="noreferrer" style={{ fontSize:'0.74rem', color:'var(--accent-light)', textDecoration:'none', padding:'2px 8px', border:'1px solid var(--border-accent)', borderRadius:'var(--radius-sm)' }}>Open in Teams</a>
        </div>
      )}
    </div>
    <div style={{ textAlign:'right', flexShrink:0 }}>
      {callStatus==='DIALING'   && <div style={{ color:'var(--status-warning)', display:'flex', alignItems:'center', gap:8, fontSize:'0.9rem' }}><span className="pulsing-dot" style={{ width:9,height:9,borderRadius:'50%',backgroundColor:'var(--status-warning)' }}/>Dialing…</div>}
      {callStatus==='CONNECTED' && <div style={{ color:'var(--status-success)', display:'flex', alignItems:'center', gap:8, fontSize:'0.9rem' }}><span style={{ width:9,height:9,borderRadius:'50%',backgroundColor:'var(--status-success)',boxShadow:'0 0 6px var(--status-success)' }}/>Live · {formatTime(timer)}</div>}
      {callStatus==='LOGGING'   && <div style={{ color:'var(--accent-primary)', fontSize:'0.9rem' }}>Log Outcome</div>}
    </div>
  </div>
);

const PreCallBrief = ({ prospect }) => {
  const stack = prospect.techStack || prospect.trackingPixelData?.techStack;
  const title = prospect.title || '';
  const company = prospect.companyName || prospect.company || '';
  const isVP = /vp|vice pres|director|chief|head of/i.test(title);
  const isTech = /engineer|developer|cto|technical/i.test(title);
  const painPoint = isVP
    ? 'Scaling pipeline coverage without growing headcount'
    : isTech
      ? 'Automating repetitive outreach while keeping personalisation'
      : company
        ? `Growing ${company}'s sales pipeline efficiently`
        : 'Scaling outbound without headcount growth';
  const objective = 'Book a 15-min discovery call';

  return (
    <div style={{ backgroundColor:'var(--bg-tertiary)', padding:12, borderRadius:'var(--radius-md)', border:'1px solid var(--border-accent)' }}>
      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--accent-light)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>AI Pre-Call Brief</div>
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {[
          { label:'Title',     value: title || '—' },
          { label:'Company',   value: company || '—' },
          { label:'Objective', value: objective },
          ...(stack ? [{ label:'Stack', value: stack }] : []),
        ].map(item=>(
          <div key={item.label} style={{ display:'flex', gap:10, fontSize:'0.83rem' }}>
            <span style={{ color:'var(--text-muted)', fontWeight:600, minWidth:72, flexShrink:0 }}>{item.label}</span>
            <span style={{ color:'var(--text-secondary)' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CallScript = ({ prospect }) => {
  const firstName = prospect.firstName || 'there';
  const title = prospect.title || '';
  const company = prospect.companyName || prospect.company || '';
  const stack = prospect.techStack || prospect.trackingPixelData?.techStack || '';
  const isVP = /vp|vice pres|director|chief|head of/i.test(title);
  const isTech = /engineer|developer|cto|technical/i.test(title);
  const isSales = /sales|revenue|account exec|ae |sdr|bdr/i.test(title);

  const hook = company
    ? `I noticed ${company} has been investing in scaling your outbound motion`
    : `I came across your profile and thought our timing might align`;

  const valueAngle = isTech
    ? 'teams like yours are connecting their existing stack directly to our automation engine — no rip-and-replace, just layering intelligence on top'
    : isSales
      ? 'high-performing sales teams are using AI sequencing to hit quota without adding headcount — same rep count, 3x the pipeline'
      : isVP
        ? 'revenue leaders at similar-stage companies are getting full pipeline visibility and predictable outbound without growing the BDR team'
        : 'orgs your size are automating the repetitive outbound work so their team can focus on actual selling';

  const stackNote = stack
    ? ` We integrate natively with ${stack.split(',')[0].trim()}, so setup is usually under a day.`
    : '';

  const lines = [
    `"Hi ${firstName}, this is Henry calling from Outreach.ai.`,
    `${hook} — and I wanted to reach out directly.`,
    `${valueAngle.charAt(0).toUpperCase() + valueAngle.slice(1)}.${stackNote}`,
    `Do you have 2 minutes to hear how it works?"`,
  ];

  const [open, setOpen] = React.useState(false);

  return (
    <div style={{ backgroundColor:'var(--bg-tertiary)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-color)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)' }}
      >
        <span style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)' }}>AI Talk Track</span>
        <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{open ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {open && (
        <div style={{ padding:'0 14px 14px' }}>
          <div style={{ lineHeight:1.8, fontSize:'0.875rem', color:'var(--text-primary)', display:'flex', flexDirection:'column', gap:10 }}>
            {lines.map((line, i) => (
              <p key={i} style={{ margin:0 }}>{line}</p>
            ))}
          </div>
          {(isTech || isVP || isSales) && (
            <div style={{ marginTop:12, padding:'8px 12px', backgroundColor:'var(--accent-dim)', border:'1px solid var(--border-accent)', borderRadius:'var(--radius-sm)', fontSize:'0.76rem', color:'var(--accent-light)' }}>
              Persona: {isTech ? 'Technical buyer — lead with integration ease' : isSales ? 'Sales practitioner — lead with quota attainment' : 'VP / Decision-maker — lead with ROI and headcount'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const QueuePane = ({ prospects, currentIndex, activeIds=[] }) => (
  <div className="left-pane glass-card">
    <h3>Queue ({Math.max(0,prospects.length-currentIndex)} remaining)</h3>
    <ul style={{ marginTop:12 }}>
      {prospects.map((p,idx) => {
        const isActive = activeIds.includes(p.id) || idx===currentIndex;
        return (
          <li key={p.id||idx} style={{ padding:'8px 12px', borderBottom:'1px solid var(--border-subtle)', backgroundColor:isActive?'var(--accent-soft)':'transparent', borderLeft:isActive?'3px solid var(--accent-primary)':'3px solid transparent', opacity:idx<currentIndex&&!activeIds.includes(p.id)?0.4:1, display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all 0.25s ease' }}>
            <div>
              <strong style={{ fontSize:'0.88rem' }}>{p.firstName} {p.lastName}</strong>
              <div style={{ fontSize:'0.77rem', color:'var(--text-secondary)' }}>{p.companyName || p.company}</div>
            </div>
            {idx<currentIndex&&!activeIds.includes(p.id) && <span style={{ color:'var(--status-success)',fontSize:'0.9rem' }}>✓</span>}
            {isActive && <span style={{ color:'var(--accent-primary)',fontSize:'0.78rem',fontWeight:600 }}>Active</span>}
          </li>
        );
      })}
    </ul>
  </div>
);

const SessionComplete = ({ onEnd, attempted = 0, total = 0, outcomes = {} }) => {
  const { connected = 0, voicemail = 0, noAnswer = 0, badNumber = 0 } = outcomes;
  const contactRate = attempted > 0 ? Math.round((connected / attempted) * 100) : 0;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:'2.5rem' }}>🎉</div>
      <h2 style={{ marginBottom:2 }}>Session Complete</h2>
      <p style={{ color:'var(--text-secondary)', margin:0 }}>All {total} contacts processed.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:8, width:'100%', maxWidth:480 }}>
        {[
          { label:'Connected', value:connected, color:'var(--status-success)' },
          { label:'Voicemail', value:voicemail, color:'var(--status-info)' },
          { label:'No Answer', value:noAnswer, color:'var(--text-muted)' },
          { label:'Bad Number', value:badNumber, color:'var(--status-warning)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'12px 10px', textAlign:'center' }}>
            <div style={{ fontSize:'1.5rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>
        Contact rate: <strong style={{ color:'var(--accent-primary)' }}>{contactRate}%</strong>
      </div>
      <button className="secondary" style={{ marginTop:8 }} onClick={onEnd}>← Back to Calls</button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Call Stats Bar
// ─────────────────────────────────────────────────────────
const CallStatsBar = ({ attempted, total, outcomes = {} }) => {
  const pct = total > 0 ? Math.round((attempted / total) * 100) : 0;
  const { connected = 0, voicemail = 0, noAnswer = 0, badNumber = 0 } = outcomes;
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Calls Attempted</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>{attempted}</span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {total}</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['✅', connected, 'var(--status-success)', 'Connected'], ['🔊', voicemail, 'var(--status-info)', 'VM'], ['🚫', noAnswer, 'var(--text-muted)', 'No Ans'], ['⚠️', badNumber, 'var(--status-warning)', 'Bad #']].map(([icon, count, color, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color }}>
            {icon} <strong>{count}</strong> <span style={{ color: 'var(--text-muted)' }}>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Manual Session
// ─────────────────────────────────────────────────────────
const ManualSession = ({ prospects, settings, onEnd }) => {
  const toast = useToast();
  const [idx, setIdx]           = useState(0);
  const [status, setStatus]     = useState('IDLE');
  const [timer, setTimer]       = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [outcomes, setOutcomes]   = useState({ connected: 0, voicemail: 0, noAnswer: 0, badNumber: 0 });
  const [callNote, setCallNote]   = useState('');

  useEffect(() => {
    let iv; if (status==='CONNECTED') iv=setInterval(()=>setTimer(t=>t+1),1000); else setTimer(0);
    return ()=>clearInterval(iv);
  }, [status]);

  const prospect = prospects[idx];
  const recordings = getVmRecordings();
  const nextVm = getNextVm(prospect?.id, recordings);

  const dial = () => {
    const link = getTeamsLink(prospect);
    if (link) window.open(link,'_blank');
    setStatus('DIALING');
    setCallTs(prospect.id);
    setAttempted(a => a + 1);
    api.post(`/voice/dial/${prospect.id}`,{mode:'manual'}).catch(console.error);
    setTimeout(()=>setStatus('CONNECTED'), DIALING_CONNECT_DELAY_MS);
  };

  const logOutcome = async (outcome, note = '') => {
    try { await api.post(`/voice/calls/${prospect.id}/outcome`,{outcome,duration:timer,notes:note}); } catch(e){console.error(e);}
    const outcomeIcons = { 'Connected': '✅', 'Left Voicemail': '🔊', 'No Answer': '🚫', 'Bad Number': '⚠️' };
    toast(`${outcomeIcons[outcome] || ''} ${outcome} — ${prospect.firstName} ${prospect.lastName}`, 'info', 2500);
    setCallNote('');
    setOutcomes(o => ({
      ...o,
      connected:  outcome==='Connected'      ? o.connected+1  : o.connected,
      voicemail:  outcome==='Left Voicemail' ? o.voicemail+1  : o.voicemail,
      noAnswer:   outcome==='No Answer'      ? o.noAnswer+1   : o.noAnswer,
      badNumber:  outcome==='Bad Number'     ? o.badNumber+1  : o.badNumber,
    }));
    if (idx+1 < prospects.length) { setIdx(i=>i+1); setStatus('IDLE'); } else setStatus('FINISHED');
  };

  if (status==='FINISHED') return <SessionComplete onEnd={onEnd} attempted={attempted} total={prospects.length} outcomes={outcomes}/>;

  return (
    <div className="split-pane">
      <QueuePane prospects={prospects} currentIndex={idx}/>
      <div className="center-pane glass-card" style={{ flex:2, display:'flex', flexDirection:'column' }}>
        <ProspectHeader prospect={prospect} callStatus={status} timer={timer}/>
        <div style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
          <PreCallBrief prospect={prospect}/>
          <CallScript prospect={prospect}/>
        </div>
      </div>
      <div className="right-pane glass-card">
        <h3>Manual Mode</h3>
        <CallStatsBar attempted={attempted} total={prospects.length} outcomes={outcomes}/>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.82rem', marginBottom:16, marginTop:0 }}>
          Click to call, speak with the prospect, hang up, then log the outcome.
        </p>
        {status==='IDLE' && <button className="success-btn" style={{ width:'100%', padding:'11px', fontSize:'0.95rem' }} onClick={dial}>☎ Call {prospect.firstName}</button>}
        {(status==='DIALING'||status==='CONNECTED') && <button className="danger" style={{ width:'100%', padding:'11px', fontSize:'0.95rem' }} onClick={()=>setStatus('LOGGING')}>Hang Up</button>}
        {status==='LOGGING' && (
          <>
            <OutcomeButtons onLog={logOutcome} callNote={callNote} onNoteChange={setCallNote}/>
            {settings.vmDrop && recordings.length > 0 && (
              <div style={{ marginTop:16, padding:'12px 14px', background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Next VM in Rotation</div>
                {nextVm ? (
                  <>
                    <div style={{ fontWeight:600, fontSize:'0.88rem', marginBottom:4 }}>{nextVm.name}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:10 }}>{formatTime(nextVm.duration)} · Leave it manually on the call, then mark below</div>
                    <button className="secondary" style={{ width:'100%', fontSize:'0.82rem', padding:'7px' }} onClick={()=>{ recordVmDropped(prospect.id,nextVm.id); logOutcome('Left Voicemail', callNote); }}>
                      ✓ Mark "{nextVm.name}" as Left
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>All {recordings.length} VMs already left for this prospect.</div>
                )}
              </div>
            )}
          </>
        )}
        <div style={{ marginTop:16, borderTop:'1px solid var(--border-subtle)', paddingTop:12 }}>
          <button className="ghost" style={{ width:'100%', fontSize:'0.82rem' }} onClick={onEnd}>← Exit Session</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Sequential Session
// ─────────────────────────────────────────────────────────
// Call status state machine:
//
//   IDLE ──dial()──► DIALING ──(delay)──► CONNECTED ──hangUp()──► LOGGING
//                                                                      │
//                    ┌─────────────────── pauseRequested? ◄────────────┤
//                    │                                                  │
//                    ▼                                                  ▼
//                 PAUSED ──resume()──► (next IDLE)          VM_DROPPING / WAITING
//                                                                      │
//                                              advance(nextIdx) ◄──────┘
//                                                      │
//                              nextIdx >= total? FINISHED : (next IDLE/WAITING)
const SequentialSession = ({ prospects, settings, onEnd }) => {
  const toast = useToast();
  const [idx, setIdx]                     = useState(0);
  const [status, setStatus]               = useState('IDLE');
  const [timer, setTimer]                 = useState(0);
  const [countdown, setCountdown]         = useState(0);
  const [pauseRequested, setPauseReq]     = useState(false);
  const [pendingIdx, setPendingIdx]       = useState(null);
  const [droppingVm, setDroppingVm]      = useState(null);
  const [callNote, setCallNote]           = useState('');
  const [attempted, setAttempted]         = useState(0);
  const [outcomes, setOutcomes]           = useState({ connected: 0, voicemail: 0, noAnswer: 0, badNumber: 0 });
  const countdownRef  = useRef(null);
  const audioRef      = useRef(null);

  useEffect(() => {
    let iv; if(status==='CONNECTED') iv=setInterval(()=>setTimer(t=>t+1),1000); else setTimer(0);
    return ()=>clearInterval(iv);
  }, [status]);

  useEffect(() => () => { clearInterval(countdownRef.current); audioRef.current?.pause(); }, []);

  const prospect = prospects[idx];

  const dial = (p) => {
    const link = getTeamsLink(p);
    if (link) window.open(link,'_blank');
    setStatus('DIALING');
    setCallTs(p.id);
    setAttempted(a => a + 1);
    api.post(`/voice/dial/${p.id}`,{mode:'sequential'}).catch(console.error);
    setTimeout(()=>setStatus('CONNECTED'), DIALING_CONNECT_DELAY_MS);
  };

  const advance = (nextIdx) => {
    if (nextIdx >= prospects.length) { setStatus('FINISHED'); return; }
    if (pauseRequested) {
      setPendingIdx(nextIdx);
      setStatus('PAUSED');
      setPauseReq(false);
      return;
    }
    if (settings.delaySeconds > 0) {
      setStatus('WAITING');
      setCountdown(settings.delaySeconds);
      countdownRef.current = setInterval(()=>{
        setCountdown(c => {
          if (c<=1) {
            clearInterval(countdownRef.current);
            setIdx(nextIdx);
            setStatus('IDLE');
            setTimeout(()=>dial(prospects[nextIdx]),50);
            return 0;
          }
          return c-1;
        });
      },1000);
    } else {
      setIdx(nextIdx);
      setStatus('IDLE');
      setTimeout(()=>dial(prospects[nextIdx]),50);
    }
  };

  const dropVmAndAdvance = (p, nextIdx) => {
    const recs = getVmRecordings();
    const vm   = getNextVm(p.id, recs);
    if (!vm) { advance(nextIdx); return; }
    recordVmDropped(p.id, vm.id);
    setDroppingVm(vm);
    setStatus('VM_DROPPING');
    audioRef.current = new Audio(vm.audioDataUrl);
    audioRef.current.play().catch(console.error);
    audioRef.current.onended = () => { setDroppingVm(null); advance(nextIdx); };
  };

  const logOutcome = async (outcome, note = '') => {
    try { await api.post(`/voice/calls/${prospect.id}/outcome`,{outcome,duration:timer,notes:note}); } catch(e){console.error(e);}
    const outcomeIcons = { 'Connected': '✅', 'Left Voicemail': '🔊', 'No Answer': '🚫', 'Bad Number': '⚠️' };
    toast(`${outcomeIcons[outcome] || ''} ${outcome} — ${prospect.firstName} ${prospect.lastName}`, 'info', 2500);
    setCallNote('');
    setOutcomes(o => ({
      ...o,
      connected:  outcome==='Connected'      ? o.connected+1  : o.connected,
      voicemail:  outcome==='Left Voicemail' ? o.voicemail+1  : o.voicemail,
      noAnswer:   outcome==='No Answer'      ? o.noAnswer+1   : o.noAnswer,
      badNumber:  outcome==='Bad Number'     ? o.badNumber+1  : o.badNumber,
    }));
    const nextIdx = idx+1;
    if ((outcome==='No Answer'||outcome==='Left Voicemail') && settings.vmDrop) {
      dropVmAndAdvance(prospect, nextIdx);
    } else {
      advance(nextIdx);
    }
  };

  const skipDelay = () => {
    clearInterval(countdownRef.current);
    setIdx(i=>{
      const ni = typeof pendingIdx==='number'?pendingIdx:i+1;
      setTimeout(()=>dial(prospects[ni]),50);
      return ni;
    });
    setStatus('IDLE');
  };

  const resume = () => {
    const ni = typeof pendingIdx==='number' ? pendingIdx : idx+1;
    setPendingIdx(null);
    setIdx(ni);
    setStatus('IDLE');
    setTimeout(()=>dial(prospects[ni]),50);
  };

  if (status==='FINISHED') return <SessionComplete onEnd={onEnd} attempted={attempted} total={prospects.length} outcomes={outcomes}/>;

  return (
    <div className="split-pane">
      <QueuePane prospects={prospects} currentIndex={idx}/>
      <div className="center-pane glass-card" style={{ flex:2, display:'flex', flexDirection:'column' }}>
        {status==='WAITING' && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:'3rem', fontWeight:800, color:'var(--accent-primary)' }}>{countdown}</div>
            <div style={{ color:'var(--text-secondary)' }}>Dialing next in {countdown}s…</div>
            <button className="ghost" style={{ marginTop:6 }} onClick={skipDelay}>Skip Delay</button>
          </div>
        )}
        {status==='VM_DROPPING' && droppingVm && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:'2rem' }}>🔊</div>
            <div style={{ fontWeight:700, fontSize:'1.05rem' }}>Dropping Voicemail</div>
            <div style={{ color:'var(--accent-light)', fontWeight:600 }}>{droppingVm.name}</div>
            <div style={{ fontSize:'0.83rem', color:'var(--text-secondary)' }}>{formatTime(droppingVm.duration)} · Playing automatically…</div>
            <button className="ghost" style={{ marginTop:6, fontSize:'0.82rem' }} onClick={()=>{ audioRef.current?.pause(); setDroppingVm(null); advance(idx+1); }}>
              Skip VM
            </button>
          </div>
        )}
        {status==='PAUSED' && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:'2rem' }}>⏸</div>
            <h3>Session Paused</h3>
            <p style={{ color:'var(--text-secondary)', textAlign:'center', maxWidth:280 }}>Current call completed. Press Resume to continue with the next contact.</p>
            <button className="success-btn" style={{ padding:'12px 32px', marginTop:8 }} onClick={resume}>▶ Resume</button>
          </div>
        )}
        {!['WAITING','VM_DROPPING','PAUSED'].includes(status) && (
          <>
            <ProspectHeader prospect={prospect} callStatus={status} timer={timer}/>
            <div style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
              <PreCallBrief prospect={prospect}/>
              <CallScript prospect={prospect}/>
            </div>
          </>
        )}
      </div>
      <div className="right-pane glass-card">
        <h3>Sequential Mode</h3>
        <CallStatsBar attempted={attempted} total={prospects.length} outcomes={outcomes}/>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16, marginTop:0 }}>
          <span style={{ fontSize:'0.75rem', padding:'3px 8px', borderRadius:'var(--radius-full)', background:'var(--bg-primary)', border:'1px solid var(--border-color)', color:settings.vmDrop?'var(--status-success)':'var(--text-muted)' }}>
            {settings.vmDrop?'● VM drop':'○ VM drop off'}
          </span>
          <span style={{ fontSize:'0.75rem', padding:'3px 8px', borderRadius:'var(--radius-full)', background:'var(--bg-primary)', border:'1px solid var(--border-color)', color:'var(--text-muted)' }}>
            {settings.delaySeconds}s delay
          </span>
          {pauseRequested && (
            <span style={{ fontSize:'0.75rem', padding:'3px 8px', borderRadius:'var(--radius-full)', background:'var(--status-warning-soft)', border:'1px solid var(--status-warning-border)', color:'var(--status-warning)' }}>
              Pausing after this call
            </span>
          )}
        </div>

        {status==='IDLE' && <button className="success-btn" style={{ width:'100%', padding:'14px', fontSize:'1rem' }} onClick={()=>dial(prospect)}>⚡ Dial {prospect.firstName}</button>}
        {(status==='DIALING'||status==='CONNECTED') && (
          <>
            <button className="danger" style={{ width:'100%', padding:'14px', fontSize:'1rem', marginBottom:10 }} onClick={()=>setStatus('LOGGING')}>Hang Up</button>
            <button
              className="secondary"
              style={{ width:'100%', padding:'10px', fontSize:'0.88rem', borderColor:pauseRequested?'var(--status-warning)':'var(--border-color)', color:pauseRequested?'var(--status-warning)':'var(--text-secondary)' }}
              onClick={()=>setPauseReq(r=>!r)}>
              {pauseRequested ? '✕ Cancel Pause Request' : '⏸ Pause After This Call'}
            </button>
          </>
        )}
        {status==='LOGGING' && <OutcomeButtons onLog={logOutcome} callNote={callNote} onNoteChange={setCallNote}/>}
        {status==='WAITING' && <button className="danger" style={{ width:'100%', padding:'11px' }} onClick={()=>{ clearInterval(countdownRef.current); setStatus('FINISHED'); }}>Stop Session</button>}
        {status==='PAUSED' && <button className="success-btn" style={{ width:'100%', padding:'14px', fontSize:'1rem' }} onClick={resume}>▶ Resume Session</button>}
        <div style={{ marginTop:16, borderTop:'1px solid var(--border-subtle)', paddingTop:12 }}>
          <button className="ghost" style={{ width:'100%', fontSize:'0.82rem' }} onClick={onEnd}>← Exit Session</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Power Session (multi-line)
// ─────────────────────────────────────────────────────────
const PowerSession = ({ prospects, settings, onEnd }) => {
  const toast = useToast();
  const lines = settings.concurrentLines;
  const [slots, setSlots]               = useState([]);
  const [queuePos, setQueuePos]         = useState(0);
  const [timers, setTimers]             = useState({});
  const [loggingId, setLoggingId]       = useState(null);
  const [finished, setFinished]         = useState(false);
  const [pauseRequested, setPauseReq]   = useState(false);
  const [isPaused, setIsPaused]         = useState(false);
  const [outcomes, setOutcomes]         = useState({ connected: 0, voicemail: 0, noAnswer: 0, badNumber: 0 });
  const [slotNotes, setSlotNotes]       = useState({});
  const audioRefs = useRef({});

  // Initialise all concurrent slots on first render. The empty dependency array
  // is intentional — this runs exactly once when the session mounts. Re-running
  // it on prop changes would re-dial already-active calls.
  useEffect(() => {
    const initial = Array.from({length:Math.min(lines,prospects.length)},(_,i)=>{
      setCallTs(prospects[i].id);
      api.post(`/voice/dial/${prospects[i].id}`,{mode:'power'}).catch(console.error);
      return { prospectId:prospects[i].id, status:'DIALING' };
    });
    setSlots(initial);
    setQueuePos(Math.min(lines,prospects.length));
    setTimeout(()=>setSlots(s=>s.map(sl=>({...sl,status:'CONNECTED'}))), POWER_CONNECT_DELAY_MS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timers
  useEffect(()=>{
    const iv=setInterval(()=>setTimers(prev=>{ const n={...prev}; slots.forEach(sl=>{if(sl.status==='CONNECTED')n[sl.prospectId]=(prev[sl.prospectId]||0)+1;}); return n; }),1000);
    return ()=>clearInterval(iv);
  },[slots]);

  // Detect all-done
  useEffect(()=>{
    if(slots.length>0 && slots.every(s=>s.status==='DONE')) setFinished(true);
  },[slots]);

  // Auto-pause check: when pause requested and no DIALING/CONNECTED slots remain
  useEffect(()=>{
    if(pauseRequested && slots.length>0 && slots.every(s=>['DONE','LOGGING'].includes(s.status))) {
      setIsPaused(true);
      setPauseReq(false);
    }
  },[slots,pauseRequested]);

  const hangUpSlot = (id) => setSlots(s=>s.map(sl=>sl.prospectId===id?{...sl,status:'LOGGING'}:sl));

  const dropVmForSlot = (prospectId, nextFn) => {
    const recs = getVmRecordings();
    const vm   = getNextVm(prospectId, recs);
    if (!vm) { nextFn(); return; }
    recordVmDropped(prospectId, vm.id);
    audioRefs.current[prospectId] = new Audio(vm.audioDataUrl);
    audioRefs.current[prospectId].play().catch(console.error);
    audioRefs.current[prospectId].onended = nextFn;
    setSlots(s=>s.map(sl=>sl.prospectId===prospectId?{...sl,status:'VM_DROP'}:sl));
  };

  const logOutcomeSlot = async (id, outcome) => {
    const p = prospects.find(pr=>pr.id===id);
    const note = slotNotes[id] || '';
    try { await api.post(`/voice/calls/${id}/outcome`,{outcome,duration:timers[id]||0,notes:note}); } catch(e){console.error(e);}
    const outcomeIcons = { 'Connected': '✅', 'Left Voicemail': '🔊', 'No Answer': '🚫', 'Bad Number': '⚠️' };
    if (p) toast(`${outcomeIcons[outcome] || ''} ${outcome} — ${p.firstName} ${p.lastName}`, 'info', 2500);
    setSlotNotes(n => { const next = {...n}; delete next[id]; return next; });
    setOutcomes(o => ({
      ...o,
      connected:  outcome==='Connected'      ? o.connected+1  : o.connected,
      voicemail:  outcome==='Left Voicemail' ? o.voicemail+1  : o.voicemail,
      noAnswer:   outcome==='No Answer'      ? o.noAnswer+1   : o.noAnswer,
      badNumber:  outcome==='Bad Number'     ? o.badNumber+1  : o.badNumber,
    }));
    if(loggingId===id) setLoggingId(null);

    const fillSlot = () => {
      if (pauseRequested) {
        setSlots(s=>s.map(sl=>sl.prospectId===id?{...sl,status:'DONE'}:sl));
        return;
      }
      setQueuePos(pos=>{
        if(pos<prospects.length){
          const next=prospects[pos];
          setCallTs(next.id);
          api.post(`/voice/dial/${next.id}`,{mode:'power'}).catch(console.error);
          setSlots(s=>s.map(sl=>sl.prospectId===id?{prospectId:next.id,status:'DIALING'}:sl));
          setTimeout(()=>setSlots(s=>s.map(sl=>sl.prospectId===next.id&&sl.status==='DIALING'?{...sl,status:'CONNECTED'}:sl)), POWER_CONNECT_DELAY_MS);
          return pos+1;
        }
        setSlots(s=>s.map(sl=>sl.prospectId===id?{...sl,status:'DONE'}:sl));
        return pos;
      });
    };

    if ((outcome==='No Answer'||outcome==='Left Voicemail') && settings.vmDrop) {
      dropVmForSlot(id, fillSlot);
    } else {
      fillSlot();
    }
  };

  const resumeSession = () => {
    setIsPaused(false);
    setQueuePos(pos=>{
      let newPos = pos;
      const newSlots = slots.map(slot=>{
        if(slot.status==='DONE' && newPos<prospects.length){
          const next=prospects[newPos];
          setCallTs(next.id);
          api.post(`/voice/dial/${next.id}`,{mode:'power'}).catch(console.error);
          newPos++;
          return {prospectId:next.id,status:'DIALING'};
        }
        return slot;
      });
      setSlots(newSlots);
      setTimeout(()=>setSlots(s=>s.map(sl=>sl.status==='DIALING'?{...sl,status:'CONNECTED'}:sl)), POWER_CONNECT_DELAY_MS);
      return newPos;
    });
  };

  if (finished) return <SessionComplete onEnd={onEnd} attempted={queuePos} total={prospects.length} outcomes={outcomes}/>;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin:0 }}>Power Dialer — {lines} Lines</h3>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.82rem', margin:'4px 0 0' }}>
            {slots.filter(s=>s.status==='CONNECTED').length} live · {slots.filter(s=>s.status==='VM_DROP').length} dropping VM · {prospects.length-queuePos} remaining · {settings.vmDrop?'VM drop on':'VM drop off'}
            {pauseRequested && <span style={{ color:'var(--status-warning)', marginLeft:10 }}>· Pausing after this round</span>}
            {isPaused && <span style={{ color:'var(--status-warning)', marginLeft:10 }}>· Paused</span>}
          </p>
          <CallStatsBar attempted={queuePos} total={prospects.length} outcomes={outcomes}/>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {!isPaused && (
            <button
              className="secondary"
              style={{ fontSize:'0.82rem', padding:'7px 14px', borderColor:pauseRequested?'var(--status-warning)':'var(--border-color)', color:pauseRequested?'var(--status-warning)':'var(--text-secondary)' }}
              onClick={()=>setPauseReq(r=>!r)}>
              {pauseRequested ? '✕ Cancel Pause' : '⏸ Pause After Round'}
            </button>
          )}
          {isPaused && (
            <button className="success-btn" style={{ fontSize:'0.88rem', padding:'8px 18px' }} onClick={resumeSession}>
              ▶ Resume
            </button>
          )}
          <button className="ghost" style={{ fontSize:'0.82rem' }} onClick={onEnd}>← Exit</button>
        </div>
      </div>

      {/* Paused overlay message */}
      {isPaused && (
        <div style={{ background:'var(--status-warning-dim)', border:'1px solid var(--status-warning-border)', borderRadius:'var(--radius-md)', padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'1.2rem' }}>⏸</span>
          <div>
            <div style={{ fontWeight:700, color:'var(--status-warning)', fontSize:'0.9rem' }}>Session Paused</div>
            <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginTop:2 }}>All active calls have finished. Click Resume to refill lines and continue.</div>
          </div>
        </div>
      )}

      {/* Dial slots grid */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(lines,3)},1fr)`, gap:14 }}>
        {slots.map(slot=>{
          const p = prospects.find(pr=>pr.id===slot.prospectId);
          if(!p) return null;
          const isLive    = slot.status==='CONNECTED';
          const isLogging = slot.status==='LOGGING';
          const isVmDrop  = slot.status==='VM_DROP';
          return (
            <div key={slot.prospectId} style={{ background:'var(--bg-tertiary)', border:`1px solid ${isLive?'var(--status-success)':isLogging?'var(--accent-primary)':isVmDrop?'var(--status-info)':'var(--border-color)'}`, boxShadow:isLive?'0 0 0 1px var(--status-success)':isVmDrop?'0 0 0 1px var(--status-info)':'none', borderRadius:'var(--radius-md)', padding:18, opacity:slot.status==='DONE'?0.4:1, transition:'all 0.3s ease' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{p.firstName} {p.lastName}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{p.companyName || p.company}</div>
                </div>
                <div style={{ fontSize:'0.8rem' }}>
                  {slot.status==='DIALING' && <span style={{ color:'var(--status-warning)',display:'flex',alignItems:'center',gap:5 }}><span className="pulsing-dot" style={{ width:7,height:7,borderRadius:'50%',backgroundColor:'var(--status-warning)' }}/>Dialing</span>}
                  {isLive && <span style={{ color:'var(--status-success)',display:'flex',alignItems:'center',gap:5 }}><span style={{ width:7,height:7,borderRadius:'50%',backgroundColor:'var(--status-success)',boxShadow:'0 0 5px var(--status-success)' }}/>{formatTime(timers[p.id]||0)}</span>}
                  {isVmDrop && <span style={{ color:'var(--status-info)',display:'flex',alignItems:'center',gap:5 }}><span className="pulsing-dot" style={{ width:7,height:7,borderRadius:'50%',backgroundColor:'var(--status-info)' }}/>VM Drop</span>}
                  {slot.status==='DONE' && <span style={{ color:'var(--status-success)' }}>✓</span>}
                </div>
              </div>
              {isLive && !isLogging && <button className="danger" style={{ width:'100%', padding:'8px', fontSize:'0.85rem' }} onClick={()=>hangUpSlot(p.id)}>Hang Up</button>}
              {isVmDrop && (
                <div style={{ fontSize:'0.8rem', color:'var(--status-info)', marginTop:4 }}>
                  Playing voicemail…
                  <button className="ghost" style={{ fontSize:'0.78rem', padding:'3px 8px', marginLeft:8 }} onClick={()=>{ audioRefs.current[p.id]?.pause(); setSlots(s=>s.map(sl=>sl.prospectId===p.id?{...sl,status:'DONE'}:sl)); }}>Skip</button>
                </div>
              )}
              {isLogging && (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <textarea
                    value={slotNotes[p.id] || ''}
                    onChange={(e) => setSlotNotes(n => ({...n, [p.id]: e.target.value}))}
                    placeholder="Call notes… (optional)"
                    rows={2}
                    style={{ width:'100%', resize:'vertical', fontSize:'0.78rem', padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-color)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontFamily:'inherit', boxSizing:'border-box' }}
                  />
                  {[['Connected','Connected'],['Left Voicemail','Left Voicemail'],['No Answer','No Answer'],['Bad Number','Bad Number']].map(([label,val])=>{
                    const s = OUTCOME_STYLES[val];
                    return (
                      <button key={val} onClick={()=>logOutcomeSlot(p.id,val)} style={{ fontSize:'0.78rem',padding:'6px 10px',textAlign:'left',background:s.bg,border:`1px solid ${s.border}`,borderRadius:'var(--radius-sm)',color:s.color,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:600 }}>
                        <span>{s.icon}</span>{label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Up next */}
      {queuePos<prospects.length && !isPaused && (
        <div style={{ background:'var(--bg-tertiary)',borderRadius:'var(--radius-md)',padding:'12px 16px',border:'1px solid var(--border-color)' }}>
          <div style={{ fontSize:'0.75rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>Up Next</div>
          <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
            {prospects.slice(queuePos,queuePos+6).map(p=>(
              <span key={p.id} style={{ fontSize:'0.82rem',color:'var(--text-secondary)',padding:'3px 10px',background:'var(--bg-primary)',borderRadius:'var(--radius-full)',border:'1px solid var(--border-color)' }}>{p.firstName} {p.lastName}</span>
            ))}
            {prospects.length-queuePos>6&&<span style={{ fontSize:'0.82rem',color:'var(--text-muted)',padding:'3px 10px' }}>+{prospects.length-queuePos-6} more</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main View
// ─────────────────────────────────────────────────────────
const PowerDialerView = () => {
  const location = useLocation();
  const { isConfigured } = useIntegrations();
  const microsoftReady = isConfigured('microsoft');
  const [allProspects, setAllProspects]   = useState([]);
  const [sequences, setSequences]         = useState([]);
  const [queue, setQueue]                 = useState({prospects:[],label:null});
  const [mode, setMode]                   = useState(null);
  const [panel, setPanel]                 = useState(null); // null | 'settings' | 'vms'
  const [selectedListId, setSelectedListId] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [settings, setSettings]           = useState({ vmDrop:true, concurrentLines:3, delaySeconds:5, callRecording:false });

  useEffect(() => {
    const passed = location.state?.prospects;
    const passedLabel = location.state?.label||'Custom List';
    Promise.all([api.get('/prospects'),api.get('/sequences')]).then(([pRes,sRes])=>{
      const pros = pRes.data||[];
      const seqs = sRes.data||[];
      setAllProspects(pros);
      setSequences(seqs);
      if(passed&&passed.length>0){
        const resolved = passed.map(p=>typeof p==='object'?pros.find(ap=>ap.id===p.id)||p:pros.find(ap=>ap.id===p)).filter(Boolean);
        setQueue({prospects:resolved,label:passedLabel}); setSelectedListId('custom');
      } else {
        // Default to prospects actively enrolled in a sequence (not all prospects)
        const enrolledIds = new Set(
          seqs.flatMap(s => (s.prospectEnrollments||[]).filter(e=>e.status==='active').map(e=>e.prospect?.id).filter(Boolean))
        );
        const enrolled = pros.filter(p => enrolledIds.has(p.id));
        if(enrolled.length>0){
          setQueue({prospects:enrolled,label:'Active in Sequences'});
        } else if(pros.length>0){
          setQueue({prospects:pros,label:'All Prospects'});
        }
      }
    }).catch(console.error).finally(()=>setLoading(false));
  },[location.state]);

  const smartLists = buildSmartLists(allProspects, sequences);
  const recordings = getVmRecordings();
  const callTs     = getCallTs();

  const selectList = (list) => { setQueue({prospects:list.prospects,label:list.title}); setSelectedListId(list.id); };

  const startSession = (m) => {
    if(queue.prospects.length===0) return;
    saveSession(queue.label||'Call Session', queue.prospects);
    setMode(m);
  };

  if(mode==='manual')     return <ManualSession     prospects={queue.prospects} settings={settings} onEnd={()=>setMode(null)}/>;
  if(mode==='sequential') return <SequentialSession prospects={queue.prospects} settings={settings} onEnd={()=>setMode(null)}/>;
  if(mode==='power')      return <PowerSession prospects={queue.prospects} settings={settings} onEnd={()=>setMode(null)}/>;

  return (
    <div style={{ maxWidth:1100, padding:'22px 26px' }}>
      {panel==='settings' && <SettingsPanel settings={settings} onChange={setSettings} onClose={()=>setPanel(null)}/>}
      {panel==='vms'      && <VMManager onClose={()=>setPanel(null)}/>}

      {/* Header */}
      <div className="page-header" style={{ marginBottom:20 }}>
        <div>
          <h1 style={{ marginBottom:4 }}>Calls</h1>
          <p className="page-header-meta">
            {loading?'Loading…':`${queue.prospects.length} in queue · ${Object.keys(callTs).length} dialed this session`}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="ghost" style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.85rem' }} onClick={()=>setPanel(p=>p==='vms'?null:'vms')}>
            🎙 Voicemails
            {recordings.length>0 && <span style={{ fontSize:'0.7rem', background:'var(--accent-primary)', color:'#fff', borderRadius:'var(--radius-full)', padding:'1px 6px', fontWeight:700 }}>{recordings.length}</span>}
          </button>
          <button className="ghost" style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.85rem' }} onClick={()=>setPanel(p=>p==='settings'?null:'settings')}>
            ⚙ Settings
          </button>
        </div>
      </div>

      {/* Smart Lists */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Suggested Queues</div>
          {smartLists.length===0&&!loading && <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Add phone numbers to prospects to unlock smart lists</span>}
        </div>
        {loading ? (
          <div style={{ display:'flex', gap:12 }}>
            {[1,2,3].map(i=><div key={i} className="skeleton" style={{ width:240,height:138,borderRadius:'var(--radius-md)',flexShrink:0 }}/>)}
          </div>
        ) : (
          <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }}>
            {smartLists.length>0 ? smartLists.map(list=>(
              <SmartListCard key={list.id} list={list} selected={selectedListId===list.id} onSelect={selectList}/>
            )) : (
              <div style={{ padding:'20px 0', color:'var(--text-muted)', fontSize:'0.88rem' }}>No smart lists available yet.</div>
            )}
          </div>
        )}
      </div>

      {/* Active Queue Banner */}
      {queue.prospects.length>0 && (
        <div style={{ background:'var(--accent-dim)', border:'1px solid var(--border-accent)', borderRadius:'var(--radius-md)', padding:'14px 18px', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'1rem' }}>📋</span>
            <div>
              <span style={{ fontWeight:700, fontSize:'0.92rem', color:'var(--accent-light)' }}>{queue.label}</span>
              <span style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginLeft:8 }}>{queue.prospects.length} contact{queue.prospects.length!==1?'s':''} queued</span>
            </div>
          </div>
          {allProspects.length>0&&(
            <button className="ghost" style={{ fontSize:'0.8rem', padding:'5px 12px' }} onClick={()=>{ setQueue({prospects:allProspects,label:'All Prospects'}); setSelectedListId(null); }}>
              Use All ({allProspects.length})
            </button>
          )}
        </div>
      )}

      {/* VM rotation hint */}
      {settings.vmDrop && recordings.length>0 && (
        <div style={{ background:'var(--status-info-dim)', border:'1px solid var(--status-info-border)', borderRadius:'var(--radius-md)', padding:'10px 16px', marginBottom:20, fontSize:'0.82rem', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:8 }}>
          <span>🔊</span>
          <span>{recordings.length} voicemail recording{recordings.length!==1?'s':''} ready — rotating per-prospect, no duplicates will be left.</span>
        </div>
      )}
      {settings.vmDrop && recordings.length===0 && (
        <div style={{ background:'var(--status-warning-dim)', border:'1px solid var(--status-warning-border)', borderRadius:'var(--radius-md)', padding:'10px 16px', marginBottom:20, fontSize:'0.82rem', color:'var(--status-warning)', display:'flex', alignItems:'center', gap:8 }}>
          <span>⚠</span>
          <span>VM drop is enabled but no recordings exist. <button className="ghost" style={{ fontSize:'0.82rem', padding:'2px 8px' }} onClick={()=>setPanel('vms')}>Record one now →</button></span>
        </div>
      )}

      {/* Mode Cards */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Select Dialing Mode</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          <SetupTooltipBlock show={!microsoftReady} message="Microsoft 365 integration is required to make calls. Connect it in Integrations.">
            <ModeCard icon="☎" title="Manual" desc="Best for focused outreach. You control every call — dial, speak, hang up, and log the result before moving on." onSelect={()=>startSession('manual')} disabled={queue.prospects.length===0}/>
          </SetupTooltipBlock>
          <SetupTooltipBlock show={!microsoftReady} message="Microsoft 365 integration is required to make calls. Connect it in Integrations.">
            <ModeCard icon="⚡" title="Sequential" desc={`Best for volume dialing. Auto-advances after each call${settings.vmDrop?`, drops voicemails automatically`:''}, with a ${settings.delaySeconds}s pause between dials. Pausable anytime.`} onSelect={()=>startSession('sequential')} disabled={queue.prospects.length===0}/>
          </SetupTooltipBlock>
          <SetupTooltipBlock show={!microsoftReady} message="Microsoft 365 integration is required to make calls. Connect it in Integrations.">
            <ModeCard icon="🔥" title="Power" desc={`Best for high-volume blitzes. Dials ${settings.concurrentLines} lines at once and connects you only when someone picks up${settings.vmDrop?', dropping voicemails automatically':''}.`} onSelect={()=>startSession('power')} disabled={queue.prospects.length===0}/>
          </SetupTooltipBlock>
        </div>
      </div>

      {/* Queue Preview */}
      {queue.prospects.length>0 && (
        <div style={{ marginTop:24, background:'var(--bg-tertiary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:600, fontSize:'0.88rem' }}>Queue Preview</span>
            <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{queue.prospects.length} contacts</span>
          </div>
          <div style={{ maxHeight:260, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <tbody>
                {queue.prospects.map((p,i)=>{
                  const ts     = callTs[String(p.id)];
                  const phone  = p.trackingPixelData?.phone||p.phone;
                  const vmUsed = (getVmHistory()[String(p.id)]||[]).length;
                  return (
                    <tr key={p.id||i} style={{ borderBottom:'1px solid var(--border-color)' }}>
                      <td style={{ padding:'9px 20px', width:24, color:'var(--text-muted)', fontSize:'0.8rem' }}>{i+1}</td>
                      <td style={{ padding:'9px 8px' }}>
                        <div style={{ fontWeight:600, fontSize:'0.87rem' }}>{p.firstName} {p.lastName}</div>
                        <div style={{ fontSize:'0.77rem', color:'var(--text-secondary)' }}>{p.companyName || p.company}</div>
                      </td>
                      <td style={{ padding:'9px 8px', fontSize:'0.82rem', color:'var(--text-secondary)' }}>{p.email}</td>
                      <td style={{ padding:'9px 8px', fontSize:'0.8rem', color:'var(--text-muted)', fontFamily:'monospace' }}>
                        {phone||'—'}{phone&&isAmericas(p)&&<span style={{ marginLeft:5, fontFamily:'sans-serif' }}>🌎</span>}
                      </td>
                      <td style={{ padding:'9px 8px', fontSize:'0.78rem', color:'var(--text-muted)', textAlign:'center' }}>
                        {vmUsed>0&&<span title={`${vmUsed} VM${vmUsed!==1?'s':''} left`} style={{ color:'var(--status-info)' }}>🔊×{vmUsed}</span>}
                      </td>
                      <td style={{ padding:'9px 20px', fontSize:'0.78rem', color:ts?'var(--text-muted)':'var(--status-success)', textAlign:'right', whiteSpace:'nowrap' }}>
                        {ts?formatRelative(ts):'Never called'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerDialerView;
