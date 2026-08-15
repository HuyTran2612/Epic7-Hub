const pool = require('../config/db');

// GET /api/artifacts - List + Filter + Search + Pagination
exports.getArtifacts = async (req, res, next) => {
  try {
    const { rarity, class_restriction, is_limited, search, page = 1, limit = 20 } = req.query;

    let query = 'SELECT id, key_name, name, rarity, is_limited, class_restriction, image_url, updated_at FROM artifacts WHERE 1=1';
    const params = [];

    if (rarity) {
      query += ' AND rarity = ?';
      params.push(parseInt(rarity, 10));
    }
    if (class_restriction) {
      query += ' AND class_restriction = ?';
      params.push(class_restriction);
    }
    if (is_limited === 'true' || is_limited === '1') {
      query += ' AND is_limited = TRUE';
    }
    if (search) {
      query += ' AND (name LIKE ? OR key_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countQuery = query.replace('SELECT id, key_name, name, rarity, is_limited, class_restriction, image_url, updated_at', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

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

// GET /api/artifacts/:key - Detail by key_name
exports.getArtifactByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const [rows] = await pool.query('SELECT * FROM artifacts WHERE key_name = ?', [key]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Artifact not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};
