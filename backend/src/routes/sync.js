const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

router.get('/status', syncController.getSyncStatus);
router.post('/run', syncController.runSync);
router.get('/conflicts', syncController.getSyncConflicts);

module.exports = router;
