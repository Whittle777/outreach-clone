/**
 * teamsCallService.js
 *
 * Initiates and manages outbound PSTN calls via Microsoft Graph Cloud Communications API.
 * Uses application-level tokens (client_credentials) — requires Calls.Initiate.All and
 * Calls.AccessMedia.All application permissions with admin consent.
 *
 * Flow:
 *  1. Get app-level access token for the rep's tenant
 *  2. POST /communications/calls with rep's Azure AD user ID as source
 *  3. Teams rings the rep's headset/device — no Teams UI required
 *  4. Microsoft POSTs state changes to our /calls/webhook endpoint
 *  5. We forward events to the frontend via WebSocket
 */

const axios = require('axios');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * Get an application-level access token for a specific tenant.
 * Uses client_credentials — grants the app permission to act as itself.
 */
async function getAppToken(tenantId) {
  if (!tenantId) throw new Error('Tenant ID required for Calls API token.');

  const res = await axios.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id:     process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      scope:         'https://graph.microsoft.com/.default',
      grant_type:    'client_credentials',
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return res.data.access_token;
}

/**
 * Initiate an outbound PSTN call from a rep's Teams Phone number to a prospect.
 *
 * @param {string} repAzureAdId  - The rep's Azure AD object ID (stored at login)
 * @param {string} tenantId      - The rep's Microsoft tenant ID (stored at login)
 * @param {string} prospectPhone - The prospect's phone number (any format)
 * @returns {{ callId: string }} - The Microsoft call ID for tracking
 */
async function initiateCall(repAzureAdId, tenantId, prospectPhone) {
  const appToken = await getAppToken(tenantId);

  // Normalise to E.164 — strip everything except digits, prepend + if needed
  const digits = prospectPhone.replace(/\D/g, '');
  const e164   = digits.startsWith('1') ? `+${digits}` : `+1${digits}`;

  const callbackUri = `${APP_URL}/calls/webhook`;

  const res = await axios.post(
    'https://graph.microsoft.com/v1.0/communications/calls',
    {
      '@odata.type': '#microsoft.graph.call',
      callbackUri,
      requestedModalities: ['audio'],
      mediaConfig: {
        '@odata.type': '#microsoft.graph.serviceHostedMediaConfig',
      },
      source: {
        '@odata.type': '#microsoft.graph.participantInfo',
        identity: {
          '@odata.type': '#microsoft.graph.identitySet',
          user: {
            '@odata.type': '#microsoft.graph.identity',
            id: repAzureAdId,
            tenantId,
          },
        },
      },
      targets: [
        {
          '@odata.type': '#microsoft.graph.invitationParticipantInfo',
          identity: {
            '@odata.type': '#microsoft.graph.identitySet',
            phone: {
              '@odata.type': '#microsoft.graph.identity',
              id: e164,
            },
          },
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${appToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return { callId: res.data.id, appToken, tenantId };
}

/**
 * Hang up / terminate an active call.
 */
async function hangupCall(callId, tenantId) {
  const appToken = await getAppToken(tenantId);
  await axios.delete(
    `https://graph.microsoft.com/v1.0/communications/calls/${callId}`,
    { headers: { Authorization: `Bearer ${appToken}` } }
  );
}

module.exports = { initiateCall, hangupCall, getAppToken };
