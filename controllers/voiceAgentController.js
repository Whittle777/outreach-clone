const acsCallAutomation = require('../services/acsCallAutomation');

// Controller to initiate a voice agent call
exports.initiateCall = async (req, res) => {
  const { prospectId, bento } = req.body;

  try {
    const callData = await acsCallAutomation.makeOutboundCall(prospectId, bento);
    res.status(200).json(callData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to get the status of a voice agent call
exports.getCallStatus = async (req, res) => {
  const { callId } = req.params;

  try {
    // For now, we'll just return a dummy status. Replace this with actual logic to fetch call status.
    const callStatus = {
      callId,
      status: 'Connected', // Example status
    };
    res.status(200).json(callStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
