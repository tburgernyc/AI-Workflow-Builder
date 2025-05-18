/**
 * Centralized configuration for Monday.com Claude Integration App
 * This file loads environment variables and exports them as a configuration object
 * with camelCase property names for consistent access throughout the application.
 */
require('dotenv').config();

// Configuration object with camelCase properties
const config = {
  // Monday.com OAuth credentials
  mondayClientId: process.env.MONDAY_CLIENT_ID,
  mondayClientSecret: process.env.MONDAY_CLIENT_SECRET,
  mondaySigningSecret: process.env.MONDAY_SIGNING_SECRET,
  redirectUri: process.env.REDIRECT_URI,

  // Monday.com API configuration
  mondayApiToken: process.env.MONDAY_API_TOKEN,
  mondayApiUrl: process.env.MONDAY_API_URL ||
    (process.env.REGION === 'EU' ? 'https://api.eu1.monday.com/v2' : 'https://api.monday.com/v2'),

  // Claude API configuration
  claudeApiKey: process.env.CLAUDE_API_KEY,
  claudeApiUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages',
  claudeApiVersion: process.env.CLAUDE_API_VERSION || '2023-06-01',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',

  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  region: process.env.REGION || 'US',

  // Security configuration
  encryptionKey: process.env.ENCRYPTION_KEY,
  sessionSecret: process.env.SESSION_SECRET,
  adminApiKey: process.env.ADMIN_API_KEY,

  // Redis configuration (optional)
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,

  // Monitoring configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  sentryDsn: process.env.SENTRY_DSN,

  // Helper function to validate required environment variables
  validateEnv: function() {
    const requiredVars = [
      'MONDAY_CLIENT_ID',
      'MONDAY_CLIENT_SECRET',
      'MONDAY_SIGNING_SECRET',
      'REDIRECT_URI',
      'ENCRYPTION_KEY',
      'SESSION_SECRET'
    ];

    // Variables required in production but optional in development
    const productionRequiredVars = [
      'MONDAY_API_TOKEN',
      'CLAUDE_API_KEY'
    ];

    if (process.env.NODE_ENV === 'production') {
      requiredVars.push(...productionRequiredVars);
    }

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      console.error(`Error: Missing required environment variables: ${missing.join(', ')}`);
      console.error('Please set these variables in your .env file');
      return false;
    }

    return true;
  },

  // Get region-specific configuration
  getRegionConfig: function() {
    const region = this.region.toUpperCase();

    const regionConfigs = {
      'US': {
        mondayApiUrl: 'https://api.monday.com/v2',
        claudeApiUrl: 'https://api.anthropic.com/v1/messages',
        logLevel: process.env.LOG_LEVEL || 'info'
      },
      'EU': {
        mondayApiUrl: 'https://api.eu1.monday.com/v2',
        claudeApiUrl: 'https://api.anthropic.com/v1/messages',
        logLevel: process.env.LOG_LEVEL || 'info'
      }
    };

    return regionConfigs[region] || regionConfigs['US'];
  }
};

module.exports = config;
