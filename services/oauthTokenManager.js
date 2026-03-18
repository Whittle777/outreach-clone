const User = require('../models/User');

async function storeOAuthTokens(userId, accessToken, refreshToken, bento) {
  return await User.updateUserOAuthTokens(userId, accessToken, refreshToken, bento);
}

async function storeMicrosoftTokens(userId, accessToken, refreshToken, bento) {
  return await User.updateUserMicrosoftTokens(userId, accessToken, refreshToken, bento);
}

module.exports = {
  storeOAuthTokens,
  storeMicrosoftTokens,
};
