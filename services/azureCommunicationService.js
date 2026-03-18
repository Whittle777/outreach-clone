const { CommunicationIdentityClient } = require('@azure/communication-identity');
const { CallAutomationClient } = require('@azure/communication-call-automation');

const communicationIdentityClient = new CommunicationIdentityClient('<your-connection-string>');
const callAutomationClient = new CallAutomationClient('<your-connection-string>');

async function initiateOutboundCall(teamsResourceAccountObjectId, phoneNumber) {
  const user = await communicationIdentityClient.createUser();
  const tokenResponse = await communicationIdentityClient.getToken(user, ['voip']);

  const callConnection = await callAutomationClient.createCallConnection({
    sourceIdentity: user,
    targets: [{ phoneNumber }],
    callbackUrl: '<your-callback-url>',
  });

  return callConnection;
}

module.exports = {
  initiateOutboundCall,
};
