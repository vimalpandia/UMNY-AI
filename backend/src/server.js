const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const env = require('./config/env');

const server = http.createServer(app);

async function startServer() {
  // Connect to MongoDB Atlas
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`==================================================`);
    console.log(`  UMNY AI Platform Server Started`);
    console.log(`  Port: ${env.PORT}`);
    console.log(`  Environment: ${env.NODE_ENV}`);
    console.log(`  API Health: http://localhost:${env.PORT}/api/health`);
    console.log(`==================================================`);
  });
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down...');
  server.close(() => {
    console.log('[Server] Process exited.');
    process.exit(0);
  });
});

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
