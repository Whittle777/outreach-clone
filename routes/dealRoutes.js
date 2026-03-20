const express = require('express');
const DealController = require('../controllers/dealController');

const router = express.Router();

router.post('/', DealController.createDeal);
router.get('/:id', DealController.getDealById);
router.put('/:id', DealController.updateDeal);
router.delete('/:id', DealController.deleteDeal);
router.get('/', DealController.getAllDeals);

module.exports = router;
