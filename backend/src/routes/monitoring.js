const express = require('express');
const monitoringController = require('../controllers/monitoringController');

const router = express.Router();

router.get('/network/today', monitoringController.getTodayNetworkStats);

module.exports = router;

