import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { initSocket } from './services/socketService';
import { initBackgroundJobs } from './services/backgroundJobs';

import logger from './services/logger';

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

initSocket(server);

initBackgroundJobs();

server.listen(Number(PORT), '0.0.0.0', () => {
    logger.info(`🚀 Server is running with Socket.io on all interfaces at port ${PORT}`);
});
