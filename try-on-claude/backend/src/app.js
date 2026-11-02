import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

const app = express();
app.disable('x-powered-by');
// Only echo CORS headers for the configured frontend origin.
app.use(cors({ origin: (origin, cb) => cb(null, origin === env.clientUrl) }));
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
