const express = require('express');
const cors = require('cors');

const heroesRoutes = require('./routes/heroes');
const artifactsRoutes = require('./routes/artifacts');
const notesRoutes = require('./routes/notes');
const tierlistRoutes = require('./routes/tierlist');
const statsRoutes = require('./routes/stats');
const backupRoutes = require('./routes/backup');

const app = express();

const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Epic7-Hub API is running', timestamp: new Date() });
});

// API Routes
app.use('/api/heroes', heroesRoutes);
app.use('/api/artifacts', artifactsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tierlist', tierlistRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/backup', backupRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

module.exports = app;
