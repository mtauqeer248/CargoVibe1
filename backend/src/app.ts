import express from 'express';
import cors from 'cors';
import parkingRequestsRouter from './functions/parkingRequests';
import aiAssistantRouter from './functions/aiAssistant';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/parking-requests', parkingRequestsRouter);
  app.use('/ai', aiAssistantRouter);

  // ── Error handler (must be last) ──────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
