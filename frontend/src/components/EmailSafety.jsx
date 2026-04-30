import React from 'react';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h3 style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>
      {title}
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {children}
    </div>
  </div>
);

const Rule = ({ icon, title, detail, tag, tagColor = 'var(--accent)' }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '14px 16px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
  }}>
    <span style={{ fontSize: '1.15rem', lineHeight: 1, marginTop: 1 }}>{icon}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
        {tag && (
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', padding: '2px 7px',
            background: `${tagColor}22`, color: tagColor,
            border: `1px solid ${tagColor}44`, borderRadius: 4,
          }}>{tag}</span>
        )}
      </div>
      <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        {detail}
      </p>
    </div>
  </div>
);

const EmailSafety = () => (
  <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 32px' }}>

    {/* Header */}
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'var(--grad-brand)',
          boxShadow: 'var(--shadow-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>🛡️</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Email Safety &amp; Compliance</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            All rules enforced automatically — no configuration required
          </p>
        </div>
      </div>

      <div style={{
        marginTop: 20, padding: '12px 16px',
        background: 'var(--status-success-dim)',
        border: '1px solid var(--status-success-border)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.85rem', color: 'var(--status-success)',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{ fontSize: '1rem' }}>✅</span>
        <span>
          These guardrails are <strong>built into the sending engine</strong> and apply to every sequence email, regardless of who sends it or how many prospects are enrolled.
        </span>
      </div>
    </div>

    {/* Sending limits */}
    <Section title="Sending Limits">
      <Rule
        icon="📬"
        title="Daily send cap — 200 emails per day"
        tag="CAN-SPAM"
        tagColor="var(--status-success)"
        detail="The system counts every email sent since midnight and stops once the daily limit is reached. The cap is configurable via the MAX_EMAILS_PER_DAY environment variable (default: 200). This prevents sudden volume spikes that trigger spam filters."
      />
      <Rule
        icon="⏱️"
        title="2-second delay between each send"
        tag="Anti-throttle"
        tagColor="var(--accent-light)"
        detail="A 2-second pause is inserted between every outgoing email. This mimics human sending behaviour, avoids SMTP rate limiting, and gives the mail server time to process each message cleanly. Configurable via EMAIL_SEND_DELAY_MS."
      />
    </Section>

    {/* Bounce handling */}
    <Section title="Bounce &amp; Failure Handling">
      <Rule
        icon="🚫"
        title="Hard bounces immediately pause the enrollment"
        tag="Microsoft / Gmail safe"
        tagColor="var(--status-danger)"
        detail="Permanent delivery failures (SMTP 550–554, 'user unknown', 'no such mailbox', etc.) instantly pause the enrollment and mark the prospect as Bounced. No further emails are sent to that address until manually reviewed. Bounces detected via inbox polling are handled the same way."
      />
      <Rule
        icon="⚠️"
        title="3 failures within 7 days auto-pauses the enrollment"
        tag="Reputation protection"
        tagColor="var(--status-warning)"
        detail="If any single enrollment accumulates 3 or more failed send attempts within a rolling 7-day window, it is automatically paused with the reason 'max_failures'. This prevents repeated attempts to unreachable addresses from damaging sender reputation."
      />
    </Section>

    {/* Compliance headers */}
    <Section title="Compliance Headers">
      <Rule
        icon="📋"
        title="List-Unsubscribe header on every email"
        tag="CAN-SPAM · GDPR"
        tagColor="var(--accent)"
        detail="Every outbound email includes List-Unsubscribe and List-Unsubscribe-Post headers pointing to a one-click opt-out endpoint. Gmail and Outlook automatically surface an Unsubscribe button when these headers are present, reducing spam reports. Required by CAN-SPAM, GDPR, and Microsoft's bulk sender policy."
      />
      <Rule
        icon="🔗"
        title="One-click unsubscribe endpoint"
        tag="CAN-SPAM"
        tagColor="var(--accent)"
        detail="Clicking the unsubscribe link calls POST /prospects/list-unsubscribe, which immediately opts the prospect out of all sequences and updates their status. No login required. The action is irreversible via link — re-enrollment requires a deliberate action inside the app."
      />
    </Section>

    {/* Reply intelligence */}
    <Section title="Reply Intelligence">
      <Rule
        icon="✈️"
        title="Out-of-office replies pause and reschedule"
        tag="Auto"
        tagColor="var(--accent-light)"
        detail="The inbox is scanned every 10 minutes. When an OOO reply is detected, the enrollment is paused and the same step is queued to retry once the contact returns (parsed from the OOO message, with a 7-day fallback). No wasted touches while someone is on holiday."
      />
      <Rule
        icon="💬"
        title="Genuine replies stop the sequence"
        tag="Auto"
        tagColor="var(--status-success)"
        detail="If a prospect replies with a real message (not OOO or a bounce), the enrollment is immediately marked 'replied' and no further automated emails are sent. The prospect's status is updated to Replied."
      />
      <Rule
        icon="🚪"
        title="Unsubscribe replies opt the prospect out"
        tag="Auto"
        tagColor="var(--status-danger)"
        detail="Replies containing unsubscribe language ('remove me', 'stop emailing', 'opt out', etc.) trigger an immediate opt-out — identical to clicking the List-Unsubscribe link."
      />
    </Section>

    {/* Footer note */}
    <div style={{
      padding: '14px 16px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6,
    }}>
      <strong style={{ color: 'var(--text-secondary)' }}>Questions?</strong>{' '}
      All rules above are enforced server-side in <code style={{ fontSize: '0.78rem', background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: 3 }}>services/sequenceMailer.js</code> and <code style={{ fontSize: '0.78rem', background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: 3 }}>services/replyDetector.js</code>.
      Sending limits are adjustable via environment variables if your organisation's policies require different thresholds.
    </div>

  </div>
);

export default EmailSafety;
