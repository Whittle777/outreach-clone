/**
 * Microsoft OAuth 2.0 flow
 * POST /auth/microsoft/start  → returns { url } to redirect user to Microsoft login
 * GET  /auth/microsoft/callback → receives code, exchanges for tokens, saves to DB
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// APP_URL must be set in production (e.g. https://apex-bdr-production.up.railway.app)
const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
const REDIRECT_URI = `${APP_URL}/auth/microsoft/callback`;
// In production the frontend is served from the same origin as the API
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5175';
const SCOPES = [
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/Mail.Read',   // Required for reply detection
  'https://graph.microsoft.com/User.Read',
  'offline_access',
  'openid',
].join(' ');

// Ephemeral state store — maps random UUID → { clientId, clientSecret, userId }
// Entries expire after 10 minutes.
const pendingStates = new Map();
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [k, v] of pendingStates.entries()) {
    if (v.createdAt < cutoff) pendingStates.delete(k);
  }
}, 60_000);

// ── POST /auth/microsoft/start ────────────────────────────────────────────────
// Body: { clientId, clientSecret }
// Returns: { url } — the Microsoft authorization URL to open in a popup/redirect
router.post('/start', (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ message: 'Client ID and Client Secret are required.' });
  }
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { clientId, clientSecret, userId: 1, createdAt: Date.now() });

  const url =
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&state=${state}` +
    `&response_mode=query` +
    `&prompt=consent`;

  res.json({ url });
});

// ── GET /auth/microsoft/callback ──────────────────────────────────────────────
// Microsoft redirects here with ?code=...&state=...
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    const msg = encodeURIComponent(error_description || error);
    return res.redirect(`${FRONTEND_URL}/integrations?ms_error=${msg}`);
  }

  const stateData = pendingStates.get(state);
  if (!stateData) {
    return res.redirect(`${FRONTEND_URL}/integrations?ms_error=Invalid+or+expired+state.+Please+try+again.`);
  }
  pendingStates.delete(state);

  try {
    // Exchange authorization code for access + refresh tokens
    const params = new URLSearchParams({
      client_id: stateData.clientId,
      client_secret: stateData.clientSecret,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const tokenRes = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token, refresh_token } = tokenRes.data;

    // Fetch user's email address from Graph
    let email = '';
    try {
      const profileRes = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      email = profileRes.data.mail || profileRes.data.userPrincipalName || '';
    } catch (_) { /* non-fatal */ }

    // Save credentials to DB
    await prisma.integrationCredential.upsert({
      where: { provider_userId: { provider: 'microsoft', userId: stateData.userId } },
      update:  { clientId: stateData.clientId, clientSecret: stateData.clientSecret, refreshToken: refresh_token, email },
      create:  { provider: 'microsoft', clientId: stateData.clientId, clientSecret: stateData.clientSecret, refreshToken: refresh_token, email, userId: stateData.userId },
    });

    res.redirect(`${FRONTEND_URL}/integrations?ms_connected=1&ms_email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error('[Microsoft OAuth]', err.response?.data || err.message);
    const errMsg = encodeURIComponent(
      err.response?.data?.error_description || err.message || 'Token exchange failed — check your Client Secret.'
    );
    res.redirect(`${FRONTEND_URL}/integrations?ms_error=${errMsg}`);
  }
});

module.exports = router;
