const express = require('express');
const router = express.Router();
const KnowledgeGraph = require('../services/knowledgeGraph');

const knowledgeGraph = new KnowledgeGraph();

router.get('/search', async (req, res) => {
  try {
    const query = req.query.query;
    const results = await knowledgeGraph.search(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
