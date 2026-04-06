import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import propertyRoutes from './routes/property.routes';
import financingRoutes from './routes/financing.routes';
import expenseRoutes from './routes/expense.routes';
import capRateRoutes from './routes/caprate.routes';
import irrRoutes from './routes/irr.routes';
import cashFlowRoutes from './routes/cashflow.routes';
import projectionRoutes from './routes/projection.routes';
import visualizationRoutes from './routes/visualization.routes';
import scenarioRoutes from './routes/scenario.routes';
import pdfRoutes from './routes/pdf.routes';
import savedPropertyRoutes from './routes/savedProperty.routes';
import searchRoutes from './routes/search.routes';
import listingRoutes from './routes/listing.routes';
import extensionRoutes from './routes/extension.routes';
import comparisonRoutes from './routes/comparison.routes';
import dashboardRoutes from './routes/dashboard.routes';
import subscriptionRoutes from './routes/subscription.routes';
import webhookRoutes from './routes/webhook.routes';

const app = express();

// Stripe webhook needs raw body for signature verification — must come before json parser
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://projexlight.com',
    'https://dev.projexlight.com',
    ...(config.corsOrigin || []),
  ],
  credentials: true,
}));
app.use(morgan(config.logFormat));
app.use(express.json({ limit: config.bodyLimit }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/financing', financingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/caprate', capRateRoutes);
app.use('/api/irr', irrRoutes);
app.use('/api/cashflow', cashFlowRoutes);
app.use('/api/projections', projectionRoutes);
app.use('/api/visualizations', visualizationRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/saved-properties', savedPropertyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = config.port || 3000;

// Run auto-migrations then start server
import { runAutoMigrations } from './db/auto-migrate';

runAutoMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[auto-migrate] Migration failed, starting server anyway:', err.message);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });

export default app;
