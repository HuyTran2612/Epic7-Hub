const pool = require('../config/db');

// GET /api/stats - Aggregated stats for heroes, artifacts, elements, classes, rarities & limited items
exports.getStats = async (req, res, next) => {
  try {
    const [
      [totalHeroes],
      [totalArtifacts],
      [elements],
      [classes],
      [rarities],
      [limitedHeroes],
      [limitedArtifacts]
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM heroes'),
      pool.query('SELECT COUNT(*) as count FROM artifacts'),
      pool.query('SELECT element, COUNT(*) as count FROM heroes GROUP BY element ORDER BY count DESC'),
      pool.query('SELECT class, COUNT(*) as count FROM heroes GROUP BY class ORDER BY count DESC'),
      pool.query('SELECT rarity, COUNT(*) as count FROM heroes GROUP BY rarity ORDER BY rarity DESC'),
      pool.query('SELECT COUNT(*) as count FROM heroes WHERE is_limited = TRUE'),
      pool.query('SELECT COUNT(*) as count FROM artifacts WHERE is_limited = TRUE')
    ]);

    res.json({
      success: true,
      data: {
        totalHeroes: totalHeroes[0].count,
        totalArtifacts: totalArtifacts[0].count,
        limitedHeroes: limitedHeroes[0].count,
        limitedArtifacts: limitedArtifacts[0].count,
        byElement: elements,
        byClass: classes,
        byRarity: rarities
      }
    });
  } catch (error) {
    next(error);
  }
};
