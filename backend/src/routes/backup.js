const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

router.get('/export', backupController.exportBackup);
router.post('/import', backupController.importBackup);

module.exports = router;
