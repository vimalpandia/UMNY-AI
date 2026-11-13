const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const env = require('./config/env');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const modelRoutes = require('./routes/modelRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const agentRoutes = require('./routes/agentRoutes');
const fileRoutes = require('./routes/fileRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const usageRoutes = require('./routes/usageRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible streaming and media resources
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'UMNY AI',
    tagline: 'Your Intelligence. Your Assistant. Your World.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/admin', adminRoutes);

// In production, serve the built frontend assets
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('UMNY AI API Server running. Build frontend with `npm run build` to view Web UI.');
    }
  });
});

// Handle 404 for unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;

