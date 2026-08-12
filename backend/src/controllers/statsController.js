const pool = require('../config/db');

// GET /api/stats - Aggregated stats for heroes, artifacts, elements, classes, collection
exports.getStats = async (req, res, next) => {
  try {
    const [totalHeroes] = await pool.query('SELECT COUNT(*) as count FROM heroes');
    const [totalArtifacts] = await pool.query('SELECT COUNT(*) as count FROM artifacts');

    const [elements] = await pool.query('SELECT element, COUNT(*) as count FROM heroes GROUP BY element');
    const [classes] = await pool.query('SELECT class, COUNT(*) as count FROM heroes GROUP BY class');
    const [rarities] = await pool.query('SELECT rarity, COUNT(*) as count FROM heroes GROUP BY rarity');

    res.json({
      success: true,
      data: {
        totalHeroes: totalHeroes[0].count,
        totalArtifacts: totalArtifacts[0].count,
        byElement: elements,
        byClass: classes,
        byRarity: rarities
      }
    });
  } catch (error) {
    next(error);
  }
};
