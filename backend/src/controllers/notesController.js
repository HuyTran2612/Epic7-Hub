const pool = require('../config/db');

// GET /api/notes - Get notes filtered by target_type & target_id
exports.getNotes = async (req, res, next) => {
  try {
    const { target_type, target_id } = req.query;

    let query = 'SELECT * FROM user_notes WHERE 1=1';
    const params = [];

    if (target_type) {
      query += ' AND target_type = ?';
      params.push(target_type);
    }
    if (target_id) {
      query += ' AND target_id = ?';
      params.push(parseInt(target_id, 10));
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// POST /api/notes - Create or Upsert a personal note
exports.createNote = async (req, res, next) => {
  try {
    const { target_type, target_id, note, personal_tier, category = 'general', priority = 0 } = req.body;

    if (!target_type || !target_id) {
      return res.status(400).json({ success: false, message: 'target_type and target_id are required' });
    }

    const targetIdNum = parseInt(target_id, 10);
    const catStr = category || 'general';

    const validTiers = ['S', 'A', 'B', 'C', 'D'];
    const tierVal = (personal_tier && validTiers.includes(personal_tier)) ? personal_tier : null;

    // Upsert logic per (target_type, target_id, category)
    const [existing] = await pool.query(
      'SELECT id FROM user_notes WHERE target_type = ? AND target_id = ? AND (category = ? OR (? = "general" AND (category IS NULL OR category = ""))) ORDER BY id DESC LIMIT 1',
      [target_type, targetIdNum, catStr, catStr]
    );

    if (existing.length > 0) {
      const noteId = existing[0].id;
      await pool.query(
        'UPDATE user_notes SET note = ?, personal_tier = ?, category = ?, priority = ? WHERE id = ?',
        [note || null, tierVal, catStr, parseInt(priority, 10), noteId]
      );
      const [updated] = await pool.query('SELECT * FROM user_notes WHERE id = ?', [noteId]);
      return res.status(201).json({ success: true, data: updated[0] });
    }

    const [result] = await pool.query(
      'INSERT INTO user_notes (target_type, target_id, note, personal_tier, category, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [target_type, targetIdNum, note || null, tierVal, catStr, parseInt(priority, 10)]
    );

    const [created] = await pool.query('SELECT * FROM user_notes WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notes/:id - Update note
exports.updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, personal_tier, priority } = req.body;

    const [rows] = await pool.query('SELECT * FROM user_notes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const updatedNote = note !== undefined ? note : rows[0].note;
    const updatedTier = personal_tier !== undefined ? personal_tier : rows[0].personal_tier;
    const updatedPriority = priority !== undefined ? parseInt(priority, 10) : rows[0].priority;

    await pool.query(
      'UPDATE user_notes SET note = ?, personal_tier = ?, priority = ? WHERE id = ?',
      [updatedNote, updatedTier, updatedPriority, id]
    );

    const [resultRows] = await pool.query('SELECT * FROM user_notes WHERE id = ?', [id]);
    res.json({ success: true, data: resultRows[0] });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notes/:id - Delete note
exports.deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM user_notes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await pool.query('DELETE FROM user_notes WHERE id = ?', [id]);
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};
