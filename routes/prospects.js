const express = require('express');
const router = express.Router();
const { createProspect, getProspectById, getAllProspects, updateProspect, deleteProspect } = require('../models/Prospect');
const { handleProspectStatusChange } = require('../services/eventHandlers');
const { handleWebhookPayload } = require('../services/webhook');
const oauthService = require('../services/oauthService'); // New import
const UIComponentGenerator = require('../services/uiComponentGenerator'); // New import

router.get('/', async (req, res) => {
  try {
    const prospects = await getAllProspects();
    res.json(prospects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const prospect = await getProspectById(req.params.id);
    if (prospect == null) {
      return res.status(404).json({ message: 'Cannot find prospect' });
    }
    res.json(prospect);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const prospect = await createProspect(req.body.firstName, req.body.lastName, req.body.email, req.body.companyName, req.body.status);
    res.status(201).json(prospect);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const prospect = await updateProspect(req.params.id, req.body.firstName, req.body.lastName, req.body.email, req.body.companyName, req.body.status);
    if (prospect == null) {
      return res.status(404).json({ message: 'Cannot find prospect' });
    }
    // Trigger event handler for status change
    await handleProspectStatusChange(req.params.id, req.body.bento, req.body.status);
    res.json(prospect);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prospect = await deleteProspect(req.params.id);
    if (prospect == null) {
      return res.status(404).json({ message: 'Cannot find prospect' });
    }
    res.json({ message: 'Deleted prospect' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Webhook endpoint for real-time sync
router.post('/webhook', async (req, res) => {
  try {
    await handleWebhookPayload(req.body);
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Real-time sync endpoint
router.post('/sync', async (req, res) => {
  try {
    const { provider, userId } = req.body;
    const token = await oauthService.getOAuthToken(provider, userId);
    // Implement logic to sync data with provider API using the token
    res.status(200).json({ message: 'Sync initiated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to update call status
router.put('/:id/call-status', async (req, res) => {
  try {
    const { callStatus, callTimestamp } = req.body;
    const prospect = await getProspectById(req.params.id);
    if (prospect == null) {
      return res.status(404).json({ message: 'Cannot find prospect' });
    }

    const updatedCallHistory = [
      ...prospect.callHistory,
      { status: callStatus, timestamp: callTimestamp },
    ];

    const updatedProspect = await updateProspect(req.params.id, {
      ...prospect,
      callHistory: updatedCallHistory,
    });

    res.json(updatedProspect);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to generate UI components based on user text prompts
router.post('/generate-ui', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    const uiComponent = UIComponentGenerator.generateComponent(prompt);
    res.json({ uiComponent });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
