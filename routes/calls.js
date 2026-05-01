/**
 * routes/calls.js — Teams Calls API integration
 *
 * POST   /calls/initiate     Initiate an outbound call from rep's Teams Phone
 * POST   /calls/webhook      Microsoft Graph callback — call state events (no auth)
 * DELETE /calls/:callId      Hang up an active call
 * GET    /calls/active       List active calls for the current user
 */

const express  = require('express');
const router   = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma   = new PrismaClient();
const { authenticateToken } = require('../middleware/auth');
const { initiateCall, hangupCall } = require('../services/teamsCallService');
const wss = require('../websocketServer');

// In-memory call session store: callId → session object
// Each session tracks state so the webhook can update the frontend in real time
const activeCalls = new Map();

/**
 * Broadcast a JSON message to all connected WebSocket clients.
 */
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ── POST /calls/initiate ──────────────────────────────────────────────────────
router.post('/initiate', authenticateToken, async (req, res) => {
  const { prospectId, phone, enrollmentId } = req.body;
  if (!phone) return res.status(400).json({ message: 'phone is required' });

  // Load rep's Azure AD credentials
  const [user, cred] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.userId }, select: { azureAdId: true } }),
    prisma.integrationCredential.findUnique({
      where: { provider_userId: { provider: 'microsoft', userId: req.userId } },
      select: { tenantId: true },
    }),
  ]);

  if (!user?.azureAdId || !cred?.tenantId) {
    return res.status(503).json({
      message: 'Teams calling requires re-connecting your Microsoft account (azureAdId or tenantId missing). Sign out and sign in again.',
    });
  }

  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    return res.status(503).json({ message: 'Microsoft app credentials not configured on this server.' });
  }

  try {
    const { callId, tenantId } = await initiateCall(user.azureAdId, cred.tenantId, phone);

    activeCalls.set(callId, {
      callId,
      prospectId:  prospectId ? parseInt(prospectId) : null,
      enrollmentId: enrollmentId ? parseInt(enrollmentId) : null,
      repUserId:   req.userId,
      tenantId,
      state:       'establishing',
      startedAt:   null,
      endedAt:     null,
    });

    res.json({ callId, state: 'establishing' });
  } catch (err) {
    console.error('[Teams Call] initiate failed:', err.response?.data || err.message);
    const detail = err.response?.data?.error?.message || err.message;
    res.status(502).json({ message: `Teams call failed: ${detail}` });
  }
});

// ── POST /calls/webhook ───────────────────────────────────────────────────────
// Microsoft Graph posts call state changes here. No auth — validated by callId presence.
router.post('/webhook', express.json(), async (req, res) => {
  // Acknowledge immediately — Microsoft expects a fast 200/202
  res.sendStatus(202);

  const notifications = req.body?.value || [];

  for (const notif of notifications) {
    const callId    = notif.resourceData?.id;
    const newState  = notif.resourceData?.state;
    const resultInfo = notif.resourceData?.resultInfo;

    if (!callId || !newState) continue;

    const session = activeCalls.get(callId);
    if (!session) continue;

    session.state = newState;

    if (newState === 'established') {
      session.startedAt = new Date();
    }

    if (newState === 'terminated') {
      session.endedAt = new Date();
      const durationSecs = session.startedAt
        ? Math.round((session.endedAt - session.startedAt) / 1000)
        : null;

      // Auto-create a CallActivity record
      try {
        if (session.prospectId) {
          await prisma.callActivity.create({
            data: {
              prospectId:    session.prospectId,
              enrollmentId:  session.enrollmentId || undefined,
              status:        durationSecs > 0 ? 'connected' : 'no_answer',
              outcome:       durationSecs > 0 ? 'connected' : 'no_answer',
              completedAt:   session.endedAt,
              durationSecs,
            },
          });
        }
      } catch (dbErr) {
        console.error('[Teams Call] failed to write CallActivity:', dbErr.message);
      }

      activeCalls.delete(callId);
    }

    // Push state update to all connected browser clients via WebSocket
    broadcast({
      type:         'call_state',
      callId,
      state:        newState,
      durationSecs: session.startedAt
        ? Math.round((Date.now() - session.startedAt) / 1000)
        : null,
      resultInfo,
    });
  }
});

// ── DELETE /calls/:callId ─────────────────────────────────────────────────────
router.delete('/:callId', authenticateToken, async (req, res) => {
  const { callId } = req.params;
  const session = activeCalls.get(callId);

  if (!session) return res.status(404).json({ message: 'Call not found or already ended.' });
  if (session.repUserId !== req.userId) return res.status(403).json({ message: 'Not your call.' });

  try {
    await hangupCall(callId, session.tenantId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Teams Call] hangup failed:', err.response?.data || err.message);
    res.status(502).json({ message: 'Hangup failed — call may have already ended.' });
  }
});

// ── GET /calls/active ─────────────────────────────────────────────────────────
router.get('/active', authenticateToken, (req, res) => {
  const mine = [...activeCalls.values()].filter(s => s.repUserId === req.userId);
  res.json(mine);
});

module.exports = router;
