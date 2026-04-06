import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appName: process.env.APP_NAME || 'Real Estate Deal Evaluator',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'real_estate_deal_evaluator_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },

  // Security
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

  // OAuth
  oauth: {
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_LOGIN_CLIENT_ID || process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_LOGIN_CLIENT_SECRET || process.env.LINKEDIN_CLIENT_SECRET || '',
      callbackUrl: process.env.LINKEDIN_LOGIN_REDIRECT_URI || process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/auth/linkedin/callback',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
  logFormat: process.env.LOG_FORMAT || 'dev',

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Body parser
  bodyLimit: process.env.BODY_PARSER_LIMIT || '10mb',

  // Property Search API
  propertyApi: {
    provider: process.env.PROPERTY_API_PROVIDER || 'rentcast',
    apiKey: process.env.PROPERTY_API_KEY || '',
  },

  // Free Tier Limits
  freeTier: {
    evaluationsPerMonth: parseInt(process.env.FREE_TIER_EVALUATIONS_PER_MONTH || '5', 10),
    maxSavedProperties: parseInt(process.env.FREE_TIER_MAX_SAVED_PROPERTIES || '20', 10),
    maxComparisonSize: parseInt(process.env.FREE_TIER_MAX_COMPARISON_SIZE || '3', 10),
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    prices: {
      starter: process.env.DEALEVAL_STRIPE_PRICE_STARTER || '',
      growth: process.env.DEALEVAL_STRIPE_PRICE_GROWTH || '',
      premium: process.env.DEALEVAL_STRIPE_PRICE_PREMIUM || '',
    },
  },

  // App URLs
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
