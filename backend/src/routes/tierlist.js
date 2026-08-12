const express = require('express');
const router = express.Router();
const tierlistController = require('../controllers/tierlistController');

router.get('/', tierlistController.getTierList);

module.exports = router;
