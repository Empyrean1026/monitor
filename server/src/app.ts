import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { requestLogger } from './middlewares/request-logger.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
