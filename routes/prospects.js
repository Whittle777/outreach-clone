const express = require('express');
const router = express.Router();
const { createProspect, getProspectById, getAllProspects, updateProspect, deleteProspect } = require('../controllers/prospects'); // Updated import

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

module.exports = router;
