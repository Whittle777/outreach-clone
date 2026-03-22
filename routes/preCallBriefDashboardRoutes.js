const express = require('express');
const router = express.Router();
const PreCallBriefDashboardController = require('../controllers/preCallBriefDashboardController');
const preCallBriefDashboardController = new PreCallBriefDashboardController();

router.get('/pre-call-brief/:prospectId', preCallBriefDashboardController.generatePreCallBrief);
router.post('/prospect-update', preCallBriefDashboardController.handleProspectUpdate);

module.exports = router;
