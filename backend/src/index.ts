import dotenv from 'dotenv';
// MUST load config before reading process.env
dotenv.config();

import http from 'http';
import app from './app';
import { initSocket } from './services/socketService';
import { initBackgroundJobs } from './services/backgroundJobs';

import logger from './services/logger';

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start Background Jobs
initBackgroundJobs();

server.listen(Number(PORT), '0.0.0.0', () => {
    logger.info(`🚀 Server is running with Socket.io on all interfaces at port ${PORT}`);
});
