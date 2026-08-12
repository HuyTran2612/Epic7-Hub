const pool = require('../config/db');

// GET /api/heroes - List + Filter + Search + Pagination
exports.getHeroes = async (req, res, next) => {
  try {
    const { element, class: heroClass, rarity, search, page = 1, limit = 20 } = req.query;

    let query = 'SELECT id, key_name, name, element, class, rarity, is_limited, image_url, description, updated_at FROM heroes WHERE 1=1';
    const params = [];

    if (element) {
      query += ' AND element = ?';
      params.push(element);
    }
    if (heroClass) {
      query += ' AND class = ?';
      params.push(heroClass);
    }
    if (rarity) {
      query += ' AND rarity = ?';
      params.push(parseInt(rarity, 10));
    }
    if (search) {
      query += ' AND (name LIKE ? OR key_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Count total query
    const countQuery = query.replace('SELECT id, key_name, name, element, class, rarity, is_limited, image_url, description, updated_at', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(1000, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/heroes/:key - Detail by key_name
exports.getHeroByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const [rows] = await pool.query('SELECT * FROM heroes WHERE key_name = ?', [key]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hero not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

// GET /api/heroes/:key/recommendations - Recommended artifacts for hero
exports.getHeroRecommendations = async (req, res, next) => {
  try {
    const { key } = req.params;

    const [heroRows] = await pool.query('SELECT id FROM heroes WHERE key_name = ?', [key]);
    if (heroRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hero not found' });
    }

    const heroId = heroRows[0].id;
    const [recs] = await pool.query(`
      SELECT a.id, a.key_name, a.name, a.rarity, a.class_restriction, a.image_url, r.priority, r.note
      FROM hero_artifact_recommendations r
      JOIN artifacts a ON r.artifact_id = a.id
      WHERE r.hero_id = ?
      ORDER BY r.priority ASC
    `, [heroId]);

    res.json({ success: true, data: recs });
  } catch (error) {
    next(error);
  }
};
