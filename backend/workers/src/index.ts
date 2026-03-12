import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { generateImage } from './routes/generateImage';
import { generateVideo } from './routes/generateVideo';
import { interpretDream } from './routes/interpretDream';
import { manifestation } from './routes/manifestation';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';

export interface Env {
  FALAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  REVENUECAT_WEBHOOK_SECRET: string;
  RATE_LIMIT_KV: KVNamespace;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS — allow only the Expo app origins in production
app.use('*', cors({
  origin: ['https://reverie.app', 'exp://', 'reverie://'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', env: c.env.ENVIRONMENT }));

// Auth-protected routes
app.use('/api/*', authMiddleware);
app.use('/api/*', rateLimitMiddleware);

app.post('/api/generate-image', generateImage);
app.post('/api/generate-video', generateVideo);
app.post('/api/interpret-dream', interpretDream);
app.post('/api/manifestation', manifestation);

export default app;
