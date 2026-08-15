const pool = require('../config/db');

async function exportBackup(req, res) {
  try {
    const [userNotes] = await pool.query('SELECT * FROM user_notes');
    let collection = [];
    try {
      const [collRows] = await pool.query('SELECT * FROM collection');
      collection = collRows;
    } catch (e) {
      collection = [];
    }
    res.json({
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_notes: userNotes,
      collection: collection
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function importBackup(req, res) {
  try {
    const { user_notes } = req.body;
    if (Array.isArray(user_notes)) {
      for (const note of user_notes) {
        await pool.query(
          `INSERT INTO user_notes (target_type, target_id, note, personal_tier, priority, category)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE note = VALUES(note), personal_tier = VALUES(personal_tier), priority = VALUES(priority)`,
          [note.target_type, note.target_id, note.note, note.personal_tier || null, note.priority || 0, note.category || 'general']
        );
      }
    }
    res.json({ success: true, message: 'Data imported successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  exportBackup,
  importBackup
};
