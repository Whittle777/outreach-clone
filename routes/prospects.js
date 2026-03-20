const express = require('express');
const router = express.Router();
const { createProspect, getProspectById, getAllProspects, updateProspect, deleteProspect, getFilterChips, filterProspects, getTopOpportunities, recordWin, recordLoss } = require('../controllers/prospectsController');

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
    const prospect = await createProspect(req.body);
    res.status(201).json(prospect);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const prospect = await updateProspect(req.params.id, req.body);
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

// New endpoint to fetch filter chips data
router.get('/filter-chips', async (req, res) => {
  try {
    const filterChips = await getFilterChips();
    res.json(filterChips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New endpoint to filter prospects based on constraints
router.get('/filter', async (req, res) => {
  try {
    const filters = req.query;
    const prospects = await filterProspects(filters);
    res.json(prospects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New endpoint to fetch top opportunities
router.get('/top-opportunities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'dealHealthScore';
    const sortOrder = req.query.sortOrder || 'desc';
    const topOpportunities = await getTopOpportunities(limit, sortBy, sortOrder);
    res.json(topOpportunities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New endpoint to record a win outcome
router.post('/:id/win', async (req, res) => {
  try {
    const prospect = await recordWin(req.params.id);
    if (prospect == null) {
      return res.status(404).json({ message: 'Cannot find prospect' });
    }
    res.json(prospect);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New endpoint to record a loss outcome
router.post('/:id/loss', async (req, res) => {
  try {
    const prospect = await recordLoss(req.params.id);
    if (prospect == null) {
      return res.status(404).json({ message: 'Cannot find prospect' });
    }
    res.json(prospect);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
