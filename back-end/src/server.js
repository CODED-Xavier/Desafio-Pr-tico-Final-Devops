const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { pool } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { createTables } = require('./database/migrations');

// 1. Importar a biblioteca do Prometheus
const client = require('prom-client');

// 2. Iniciar a recolha das métricas padrão do Node.js
client.collectDefaultMetrics();

// 3. Expor a rota /metrics para o Prometheus raspar (fazer scrape)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
  } catch (err) {
    logger.error('Erro ao expor métricas', { error: err.message });
    res.status(500).end(err);
  }
});

const start = async () => {
  try {
    // Run migrations
    await createTables();
    logger.info('Database migrations applied');

    // Connect to Redis
    await connectRedis();

    // Start HTTP server
    const server = app.listen(env.port, () => {
      logger.info(`Server running on http://localhost:${env.port}`);
      logger.info(`Environment: ${env.nodeEnv}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectRedis();
          logger.info('Redis disconnected');
        } catch (err) {
          logger.error('Error disconnecting Redis', { error: err.message });
        }

        try {
          await pool.end();
          logger.info('Database pool closed');
        } catch (err) {
          logger.error('Error closing database pool', { error: err.message });
        }

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

start();