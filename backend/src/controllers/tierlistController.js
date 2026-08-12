const pool = require('../config/db');

// GET /api/tierlist - Returns heroes grouped by personal tier and category (general, pve, pvp, gw)
exports.getTierList = async (req, res, next) => {
  try {
    const category = req.query.category || 'general';

    const [rows] = await pool.query(`
      SELECT h.id, h.key_name, h.name, h.element, h.class, h.rarity, h.image_url, n.personal_tier, n.note
      FROM heroes h
      LEFT JOIN (
        SELECT n1.target_id, n1.personal_tier, n1.note
        FROM user_notes n1
        INNER JOIN (
          SELECT MAX(id) as max_id
          FROM user_notes
          WHERE target_type = 'hero' AND (category = ? OR (? = 'general' AND (category IS NULL OR category = '')))
          GROUP BY target_id
        ) n2 ON n1.id = n2.max_id
      ) n ON n.target_id = h.id
      ORDER BY FIELD(n.personal_tier, 'S', 'A', 'B', 'C', 'D') ASC, h.name ASC
    `, [category, category]);

    const grouped = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      Unranked: []
    };

    const seenIds = new Set();
    rows.forEach(hero => {
      if (seenIds.has(hero.id)) return;
      seenIds.add(hero.id);

      const tier = hero.personal_tier;
      if (tier && grouped[tier]) {
        grouped[tier].push(hero);
      } else {
        grouped.Unranked.push(hero);
      }
    });

    res.json({ success: true, data: grouped });
  } catch (error) {
    next(error);
  }
};
