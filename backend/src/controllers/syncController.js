const pool = require('../config/db');
const { runUnifiedSync } = require('../../scripts/sync');

let syncState = {
  isRunning: false,
  startTime: null,
  lastCompletedAt: null,
  status: 'idle',
  message: 'System ready.'
};

exports.getSyncStatus = async (req, res, next) => {
  try {
    const [logs] = await pool.query('SELECT * FROM sync_logs ORDER BY id DESC LIMIT 5');
    res.json({
      success: true,
      data: {
        isRunning: syncState.isRunning,
        status: syncState.status,
        message: syncState.message,
        startTime: syncState.startTime,
        lastCompletedAt: syncState.lastCompletedAt,
        historyLogs: logs
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.runSync = async (req, res, next) => {
  try {
    if (syncState.isRunning) {
      return res.status(409).json({
        success: false,
        message: 'Sync pipeline is already running in the background.'
      });
    }

    const { limit = 0 } = req.body || {};
    syncState.isRunning = true;
    syncState.status = 'running';
    syncState.startTime = new Date();
    syncState.message = `Data sync triggered via Web UI (limit=${limit})...`;

    // Launch background execution
    process.nextTick(async () => {
      try {
        if (limit) process.env.SYNC_LIMIT = String(limit);
        else delete process.env.SYNC_LIMIT;

        await runUnifiedSync();
        syncState.status = 'success';
        syncState.message = 'Sync completed successfully.';
      } catch (err) {
        syncState.status = 'failed';
        syncState.message = `Sync failed: ${err.message}`;
      } finally {
        syncState.isRunning = false;
        syncState.lastCompletedAt = new Date();
      }
    });

    res.json({
      success: true,
      message: 'Data sync triggered successfully in background.',
      status: 'running'
    });
  } catch (error) {
    syncState.isRunning = false;
    next(error);
  }
};

exports.getSyncConflicts = async (req, res, next) => {
  try {
    const [conflicts] = await pool.query('SELECT * FROM sync_conflicts ORDER BY id DESC LIMIT 50');
    res.json({
      success: true,
      data: conflicts
    });
  } catch (error) {
    next(error);
  }
};
