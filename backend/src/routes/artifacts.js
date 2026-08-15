const express = require('express');
const router = express.Router();
const artifactsController = require('../controllers/artifactsController');

router.get('/', artifactsController.getArtifacts);
router.get('/:key', artifactsController.getArtifactByKey);
router.put('/:id', artifactsController.updateArtifact);

module.exports = router;
