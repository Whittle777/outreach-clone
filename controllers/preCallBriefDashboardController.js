const PreCallBriefDashboard = require('../services/preCallBriefDashboard');
const preCallBriefDashboard = new PreCallBriefDashboard();

class PreCallBriefDashboardController {
  async generatePreCallBrief(req, res) {
    try {
      const prospectId = req.params.prospectId;
      const preCallBrief = await preCallBriefDashboard.generatePreCallBrief(prospectId);

      if (preCallBrief) {
        res.json(preCallBrief);
      } else {
        res.status(404).json({ message: 'Pre-Call Brief not available' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error generating pre-call brief', error: error.message });
    }
  }

  async handleProspectUpdate(req, res) {
    try {
      const prospectData = req.body.prospectData;
      await preCallBriefDashboard.handleProspectUpdate(prospectData);
      res.json({ message: 'Prospect update handled successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error handling prospect update', error: error.message });
    }
  }
}

module.exports = PreCallBriefDashboardController;
