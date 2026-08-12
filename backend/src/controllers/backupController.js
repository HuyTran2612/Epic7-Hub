const pool = require('../config/db');

// GET /api/backup/export - Download full JSON backup of notes
exports.exportBackup = async (req, res, next) => {
  try {
    const [notes] = await pool.query('SELECT * FROM user_notes');

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user_notes: notes
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="epic7-personal-backup.json"');
    res.json(backup);
  } catch (error) {
    next(error);
  }
};

// POST /api/backup/import - Restore notes from JSON payload
exports.importBackup = async (req, res, next) => {
  try {
    const { user_notes } = req.body;

    if (!Array.isArray(user_notes)) {
      return res.status(400).json({ success: false, message: 'Invalid backup format' });
    }

    let notesImported = 0;

    if (Array.isArray(user_notes)) {
      for (const n of user_notes) {
        await pool.query(
          'INSERT INTO user_notes (target_type, target_id, note, personal_tier, priority) VALUES (?, ?, ?, ?, ?)',
          [n.target_type, n.target_id, n.note || null, n.personal_tier || null, n.priority || 0]
        );
        notesImported++;
      }
    }

    res.json({
      success: true,
      message: `Backup imported successfully: ${notesImported} notes.`
    });
  } catch (error) {
    next(error);
  }
};
