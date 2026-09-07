import { prisma } from '../prisma/prisma.js';
import { app } from './app.js';
import config from './config/config.js';
import { logger } from './config/logger.js';

let server;

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Connected to database successfully');

    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to connect to database', error);
    process.exit(1);
  }
}

startServer();

const gracefulShutdown = async (_signal) => {
  if (server) {
    server.close(async () => {
      logger.info('Server express closed.');
      try {
        await prisma.$disconnect();
        logger.info('Database connection closed.');
        process.exit(0);
      } catch (error) {
        logger.error('Error during database disconnection:', error);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

const unexpectedErrorHandler = async (error) => {
  logger.error('Unexpected error occurred:', error);
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
