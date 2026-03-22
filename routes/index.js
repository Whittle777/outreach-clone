const express = require('express');
const router = express.Router();

const timeBlockConfigController = require('../controllers/timeBlockConfig');

router.post('/timeBlockConfigs', timeBlockConfigController.create);
router.get('/timeBlockConfigs', timeBlockConfigController.getAll);
router.get('/timeBlockConfigs/:id', timeBlockConfigController.getOne);
router.put('/timeBlockConfigs/:id', timeBlockConfigController.update);
router.delete('/timeBlockConfigs/:id', timeBlockConfigController.delete);

module.exports = router;
