const stateMachine = require('../services/stateMachine');

async function handleProspectStatusChangeEvent(req, res, next) {
  const { prospectId, bento, newStatus } = req.body;

  try {
    await stateMachine.handleProspectStatusChange(prospectId, bento, newStatus);
    res.status(200).json({ message: 'Prospect status change handled successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleProspectStatusChangeEvent,
};
