import React, { useState, useEffect } from 'react';

const TrafficLight = ({ status, label }) => {
  const colors = { green: 'var(--status-success)', yellow: 'var(--status-warning)', red: 'var(--status-danger)' };
  const color = colors[status] || colors.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: `1px solid ${color}22` }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color, textTransform: 'uppercase', fontWeight: 700 }}>{status}</span>
    </div>
  );
};

const SpeedometerGauge = ({ value, max, label, danger, warning }) => {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= danger ? 'var(--status-danger)' : pct >= warning ? 'var(--status-warning)' : 'var(--status-success)';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block', width: 120, height: 60, overflow: 'hidden' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', border: '12px solid var(--bg-primary)', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(-45deg)', position: 'absolute', top: 0, left: 0 }} />
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          border: '12px solid transparent',
          borderTopColor: color,
          borderLeftColor: pct > 25 ? color : 'transparent',
          transform: `rotate(${-135 + (pct / 100) * 180}deg)`,
          position: 'absolute', top: 0, left: 0, transition: 'transform 0.8s ease'
        }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontSize: '1.1rem', fontWeight: 800, color }}>
          {value.toLocaleString()}
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max: {max.toLocaleString()}/day</div>
    </div>
  );
};

const DeliverabilityGate = () => {
  const [sendVolume, setSendVolume] = useState(347);
  const [warmupRatio, setWarmupRatio] = useState(0.68);

  // Simulate live send volume ticking up
  useEffect(() => {
    const interval = setInterval(() => {
      setSendVolume(prev => prev + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const emailQuality = { verified: 87, suppressed: 8, honeypots: 5 };
  const dnsStatus = { spf: 'green', dkim: 'green', dmarc: 'yellow' };
  const abuseRate = 0.18; // %
  const bounceRate = 2.4; // %

  const overallStatus = dnsStatus.spf === 'green' && dnsStatus.dkim === 'green' && abuseRate < 0.3 && bounceRate < 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ marginBottom: 4 }}>Deliverability Gate</h1>
          <p className="page-header-meta">Pre-launch health check · updated live</p>
        </div>
        <div style={{
          padding: '7px 18px',
          backgroundColor: overallStatus ? 'var(--status-success-soft)' : 'var(--status-danger-dim)',
          border: `1px solid ${overallStatus ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
          borderRadius: 'var(--radius-full)',
          color: overallStatus ? 'var(--status-success)' : 'var(--status-danger)',
          fontWeight: 700, fontSize: '0.875rem',
        }}>
          {overallStatus ? '✓ Safe to Send' : '⚠ Action Required'}
        </div>
      </div>

      {/* Top Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* Data Quality */}
        <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 18 }}>
          <h4 style={{ marginBottom: 4 }}>Data Quality Verification</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>Contact hygiene across active sequences</p>

          <div style={{ position: 'relative', height: 8, backgroundColor: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${emailQuality.verified}%`, backgroundColor: 'var(--status-success)', borderRadius: 4 }} />
            <div style={{ position: 'absolute', left: `${emailQuality.verified}%`, top: 0, bottom: 0, width: `${emailQuality.suppressed}%`, backgroundColor: 'var(--status-warning)' }} />
            <div style={{ position: 'absolute', left: `${emailQuality.verified + emailQuality.suppressed}%`, top: 0, bottom: 0, width: `${emailQuality.honeypots}%`, backgroundColor: 'var(--status-danger)' }} />
          </div>

          {[
            { label: 'Verified Emails', pct: emailQuality.verified, color: 'var(--status-success)' },
            { label: 'Suppressed (Bounced/Opted Out)', pct: emailQuality.suppressed, color: 'var(--status-warning)' },
            { label: 'Flagged (Honeypots / Invalid)', pct: emailQuality.honeypots, color: 'var(--status-danger)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: item.color }}>{item.pct}%</span>
            </div>
          ))}
        </div>

        {/* Send Volume Gauge */}
        <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4 style={{ marginBottom: 4, alignSelf: 'flex-start' }}>Dynamic Send Limits</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16, alignSelf: 'flex-start' }}>Real-time vs. AI-calculated safe threshold</p>

          <SpeedometerGauge value={sendVolume} max={2000} label="Emails Sent Today (Gmail)" danger={90} warning={70} />

          <div style={{ width: '100%', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Gmail Mailbox Cap', value: `${sendVolume} / 2,000`, pct: (sendVolume / 2000) * 100 },
              { label: 'Org Daily Limit', value: `${sendVolume * 3} / 10,000`, pct: (sendVolume * 3 / 10000) * 100 },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600 }}>{item.value}</span>
                </div>
                <div style={{ height: 5, backgroundColor: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.pct > 80 ? 'var(--status-danger)' : item.pct > 60 ? 'var(--status-warning)' : 'var(--status-success)', borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Domain Health */}
        <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 18 }}>
          <h4 style={{ marginBottom: 4 }}>Domain Health Monitoring</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>DNS authentication records</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <TrafficLight status={dnsStatus.spf} label="SPF Record" />
            <TrafficLight status={dnsStatus.dkim} label="DKIM (2048-bit)" />
            <TrafficLight status={dnsStatus.dmarc} label="DMARC Policy" />
          </div>

          <div style={{ padding: 12, backgroundColor: 'var(--status-warning-dim)', border: '1px solid var(--status-warning-border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--status-warning)', fontWeight: 700, marginBottom: 4 }}>⚠ DMARC Advisory</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Current policy is <code style={{ backgroundColor: 'var(--bg-primary)', padding: '1px 5px', borderRadius: 3 }}>p=none</code>. Recommend progressing to <code style={{ backgroundColor: 'var(--bg-primary)', padding: '1px 5px', borderRadius: 3 }}>p=quarantine</code> within 30 days.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* AI Warmup Status */}
        <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 18 }}>
          <h4 style={{ marginBottom: 4 }}>AI Email Warmup Status</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>Outbound vs. automated warmup interaction ratio</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{sendVolume}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Outbound Emails</div>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>⟷</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--status-success)' }}>{Math.floor(sendVolume * warmupRatio)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Warmup Interactions</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Warmup Ratio</div>
              <div style={{ height: 8, backgroundColor: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${warmupRatio * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--status-success))', borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--status-success)', marginTop: 4, fontWeight: 600 }}>{Math.round(warmupRatio * 100)}% — Healthy</div>
            </div>
          </div>

          <div style={{ padding: 12, backgroundColor: 'var(--status-success-dim)', border: '1px solid var(--status-success-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            ✓ Warmup cadence is on track. Inbox placement score estimated at <strong style={{ color: 'var(--status-success)' }}>94/100</strong>. No action required.
          </div>
        </div>

        {/* Reputation Metrics */}
        <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 18 }}>
          <h4 style={{ marginBottom: 4 }}>Reputation Monitoring</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>Abuse complaints & bounce classification</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ padding: 14, backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: `1px solid ${abuseRate > 0.3 ? 'var(--status-danger-border)' : 'var(--status-success-border)'}` }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: abuseRate > 0.3 ? 'var(--status-danger)' : 'var(--status-success)' }}>{abuseRate}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Abuse Complaint Rate</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Threshold: 0.3%</div>
            </div>
            <div style={{ padding: 14, backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: `1px solid ${bounceRate > 5 ? 'var(--status-danger-border)' : 'var(--status-success-border)'}` }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: bounceRate > 5 ? 'var(--status-danger)' : 'var(--status-success)' }}>{bounceRate}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bounce Rate</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Threshold: 5%</div>
            </div>
          </div>

          {[
            { label: 'RFC 8058 List-Unsubscribe', status: true },
            { label: 'One-Click Unsubscribe (POST method)', status: true },
            { label: 'Hard Bounce Auto-Suppression', status: true },
            { label: 'Soft Bounce Exponential Backoff', status: true },
            { label: 'NDR Parsing Active', status: false },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.9rem', color: item.status ? 'var(--status-success)' : 'var(--status-warning)' }}>
                {item.status ? '✓' : '○'}
              </span>
              <span style={{ fontSize: '0.82rem', color: item.status ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliverabilityGate;
