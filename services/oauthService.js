const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../models/prisma'); // Assuming you have a Prisma client

async function getOAuthToken(provider, userId) {
  const tokenRecord = await prisma.oauthToken.findUnique({
    where: {
      provider_userId: {
        provider,
        userId,
      },
    },
  });

  if (tokenRecord && !isTokenExpired(tokenRecord.expiry)) {
    return tokenRecord.token;
  }

  const newToken = await fetchNewToken(provider, userId);
  await prisma.oauthToken.create({
    data: {
      provider,
      userId,
      token: newToken,
      expiry: calculateExpiry(newToken),
    },
  });

  return newToken;
}

function isTokenExpired(expiry) {
  const now = new Date().getTime();
  return now > expiry;
}

async function fetchNewToken(provider, userId) {
  // Implement token fetching logic for each provider
  if (provider === 'google') {
    return fetchGoogleToken(userId);
  } else if (provider === 'microsoft') {
    return fetchMicrosoftToken(userId);
  }
  throw new Error('Unsupported provider');
}

async function fetchGoogleToken(userId) {
  // Example implementation for Google
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  return response.data.access_token;
}

async function fetchMicrosoftToken(userId) {
  // Example implementation for Microsoft
  const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    refresh_token: process.env.MICROSOFT_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  return response.data.access_token;
}

function calculateExpiry(token) {
  // Implement logic to calculate expiry time from token
  // This is a placeholder implementation
  return new Date().getTime() + 3600 * 1000; // 1 hour expiry
}

module.exports = { getOAuthToken };
