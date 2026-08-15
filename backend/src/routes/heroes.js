const express = require('express');
const router = express.Router();
const heroesController = require('../controllers/heroesController');

router.get('/', heroesController.getHeroes);
router.get('/:key', heroesController.getHeroByKey);
router.get('/:key/recommendations', heroesController.getHeroRecommendations);
router.put('/:id', heroesController.updateHero);

module.exports = router;
