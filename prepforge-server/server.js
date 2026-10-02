const app = require('./src/app');
const connectDB = require('./src/config/db');
const { PORT } = require('./src/config/env');

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🔧 PrepForge API Server                        ║
║                                                   ║
║   Port:    ${String(PORT).padEnd(38)}║
║   Mode:    ${String(process.env.NODE_ENV || 'development').padEnd(38)}║
║   Health:  http://localhost:${PORT}/api/v1/health${' '.repeat(Math.max(0, 13 - String(PORT).length))}║
║                                                   ║
║   "Track. Practice. Revise. Master."              ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `);
  });
};

startServer();
