// server.js with enhanced security and error handling
// Load environment variables from .env file
require('dotenv').config();

// Import the centralized config module
const config = require('./config');

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { validationResult, body } = require('express-validator');
const { Storage, Logger } = require('@mondaycom/apps-sdk');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

// Initialize monday's SDK components
const storage = new Storage();
const logger = new Logger('monday-claude-integration', {
  level: config.logLevel
});

/**
 * Verify all required environment variables are present and valid
 * This is a critical security check that runs at startup
 */
const { validateEnvironment } = require('./env-validator');

// Skip environment validation in test mode
if (process.env.NODE_ENV !== 'test') {
  // Verify environment variables before proceeding
  const envValidation = validateEnvironment();

  if (!envValidation.valid) {
    logger.error('ERROR: Environment validation failed');
    logger.error('Please fix the following issues and restart the application:');

    envValidation.errors.forEach(error => {
      logger.error(`- ${error}`);
    });

    if (envValidation.warnings.length > 0) {
      logger.warn('The following warnings were also found:');
      envValidation.warnings.forEach(warning => {
        logger.warn(`- ${warning}`);
      });
    }

    process.exit(1);
  }

  // Verify config module's environment validation
  if (!config.validateEnv()) {
    logger.error('ERROR: Config validation failed');
    logger.error('Please check your environment variables and restart the application');
    process.exit(1);
  }
}

// Load region-specific configuration
const regionConfig = config.getRegionConfig();
if (process.env.NODE_ENV !== 'test') {
  logger.info(`Using ${config.region} region configuration`);
}

// Apply region-specific settings
const MONDAY_API_URL = regionConfig.mondayApiUrl;
const CLAUDE_API_URL = regionConfig.claudeApiUrl;

// Import route handlers
const monetizationRoutes = require('./monetization-routes');
const oauthRoutes = require('./oauth-routes');

// Import controllers
const claudeController = require('./controllers/claudeController');
const mondayController = require('./controllers/mondayController');
const subscriptionController = require('./controllers/subscriptionController');

// Import utility modules
const claudeAPI = require('./monday-claude-utils/enhanced-claudeAPI');
const mondayAPI = require('./monday-claude-utils/mondayAPI');
const automationUtils = require('./monday-claude-utils/automationUtils');
const scopeValidator = require('./monday-claude-utils/scopeValidator');

// Import middleware
const { errorHandler } = require('./middleware/errorMiddleware');
const { requireAuthentication } = require('./middleware/authMiddleware');
const { cacheMiddleware } = require('./middleware/cacheMiddleware');
const redisCache = require('./monday-claude-utils/redis-cache');
const { metricsMiddleware, getMetrics } = require('./monitoring/metrics');

const app = express();

// Generate request IDs for tracking
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

// Apply cookie parser middleware
app.use(cookieParser(config.sessionSecret));

// Apply helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "monday.com", "*.monday.com"],
      connectSrc: ["'self'", "monday.com", "*.monday.com", "api.anthropic.com"],
      imgSrc: ["'self'", "data:", "monday.com", "*.monday.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "monday.com", "*.monday.com"],
      fontSrc: ["'self'", "data:", "monday.com", "*.monday.com"],
      frameSrc: ["'self'", "monday.com", "*.monday.com"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding in Monday.com iframe
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Apply compression middleware
app.use(compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  // Filter based on request headers
  filter: (req, res) => {
    // Don't compress responses for old browsers without gzip support
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use the default compression filter function
    return compression.filter(req, res);
  },
  // Set compression level (0-9, where 9 is maximum compression)
  level: 6
}));

// Import security middleware
const {
  securityHeaders,
  preventClickjacking,
  apiSecurityHeaders,
  validateRequestParams
} = require('./middleware/securityMiddleware');

// Apply security middleware
app.use(securityHeaders());
app.use(preventClickjacking);
app.use(bodyParser.json({ limit: '1mb' })); // Limit request body size
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(validateRequestParams);

// Apply metrics middleware
app.use(metricsMiddleware);

// Apply API security headers to all API routes
app.use('/api', apiSecurityHeaders);

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later'
  }
});

// More restrictive rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again later'
  }
});

// Apply rate limiting to endpoints
app.use('/api/', apiLimiter);
app.use('/oauth/authorize', authLimiter);
app.use('/oauth/callback', authLimiter);

// Load environment variables from config
const CLAUDE_API_KEY = config.claudeApiKey;
const MONDAY_API_TOKEN = config.mondayApiToken;
const REGION = config.region;
const CLAUDE_MODEL = config.claudeModel;
const CLAUDE_API_VERSION = config.claudeApiVersion;

// Log application startup information
logger.info(`Starting Monday.com Claude Integration App in ${config.nodeEnv} mode`);
logger.info(`Using region: ${REGION}`);
logger.info(`Server port: ${config.port}`);

// Initialize Redis cache if configured
let redisClient = null;
if (config.redisUrl) {
  try {
    logger.info('Initializing Redis cache');
    redisClient = redisCache.initializeRedis(config.redisUrl, config.redisPassword);
  } catch (error) {
    logger.error('Failed to initialize Redis cache', { error });
  }
}

// Mount route handlers
app.use('/', oauthRoutes);
app.use('/api', monetizationRoutes.router);

/**
 * Enhanced health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const healthCheck = require('./health-check-utils');

    // Check Monday.com API connection
    const mondayStatus = await healthCheck.checkMondayAPIConnection();

    // Check Claude API connection
    const claudeStatus = await healthCheck.checkClaudeAPIConnection();

    res.status(200).json({
      status: 'ok',
      region: config.REGION,
      environment: process.env.NODE_ENV || 'development',
      services: {
        monday: mondayStatus,
        claude: claudeStatus
      },
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Webhook challenge endpoint
 */
app.post('/webhook/challenge', (req, res) => {
  // Handle Monday.com webhook challenge
  if (req.body.challenge) {
    return res.json({ challenge: req.body.challenge });
  }

  res.status(400).json({ error: 'Invalid webhook payload' });
});

/**
 * Process a natural language request
 */
app.post('/api/process-request', [
  // Input validation
  body('userPrompt').isString().trim().isLength({ min: 1, max: 2000 })
    .withMessage('User prompt is required and must be between 1 and 2000 characters'),
  body('userId').isString().trim().notEmpty()
    .withMessage('User ID is required'),
  body('accountId').isString().trim().notEmpty()
    .withMessage('Account ID is required'),
  body('boardId').optional().isString()
], claudeController.processRequest);


/**
 * Process a document with Claude
 */
app.post('/api/process-document', [
  // Input validation
  body('document').isString().trim().isLength({ min: 1, max: 10000 })
    .withMessage('Document is required and must be between 1 and 10000 characters'),
  body('action').isString().trim().isIn(['summarize', 'analyze', 'extract_key_points', 'extract_action_items', 'simplify'])
    .withMessage('Valid action is required'),
  body('userId').isString().trim().notEmpty()
    .withMessage('User ID is required'),
  body('accountId').isString().trim().notEmpty()
    .withMessage('Account ID is required')
], claudeController.processDocument);

/**
 * Endpoint to test automation logic without creating it
 */
app.post('/api/test-automation', [
  // Input validation
  body('automation').isObject().withMessage('Automation configuration is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: errors.array()
      });
    }

    const { automation } = req.body;

    // Validate automation structure
    const validationResult = automationUtils.validateAutomationConfiguration(automation);
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Invalid automation structure',
        details: validationResult.errors
      });
    }

    // Generate optimization suggestions
    const suggestions = automationUtils.generateOptimizationSuggestions(automation);

    // Check for required permissions
    const requiredScopes = [['automations', 'create']];

    // Return success with any suggestions
    return res.json({
      result: 'success',
      message: 'Automation configuration is valid',
      suggestions,
      requiredPermissions: {
        scopes: requiredScopes,
        message: 'Creating automations requires the automations:create permission'
      }
    });

  } catch (error) {
    const errorId = uuidv4();
    logger.error('Error testing automation', { errorId, error });

    return res.status(500).json({
      error: 'Failed to test automation',
      errorId
    });
  }
});

/**
 * Get workflow templates endpoint
 */
app.get('/api/workflow-templates', cacheMiddleware({
  prefix: 'workflow-templates',
  ttl: 3600 // Cache for 1 hour
}), (req, res) => {
  try {
    const workflowTemplates = require('./monday-claude-utils/workflowTemplates');
    const templates = workflowTemplates.getAvailableTemplateNames();

    return res.json({
      templates
    });
  } catch (error) {
    logger.error('Error getting workflow templates', { error });
    return res.status(500).json({ error: 'Failed to retrieve workflow templates' });
  }
});

/**
 * Get specific workflow template
 */
app.get('/api/workflow-templates/:templateName', cacheMiddleware({
  prefix: 'workflow-template',
  ttl: 3600 // Cache for 1 hour
}), (req, res) => {
  try {
    const { templateName } = req.params;
    const workflowTemplates = require('./monday-claude-utils/workflowTemplates');
    const template = workflowTemplates.getWorkflowTemplate(templateName);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({
      template
    });
  } catch (error) {
    logger.error('Error getting workflow template', { error });
    return res.status(500).json({ error: 'Failed to retrieve workflow template' });
  }
});

/**
 * Get conversation history for a user
 */
app.get('/api/conversation-history/:userId', requireAuthentication, cacheMiddleware({
  prefix: 'conversation-history',
  ttl: 60 // Cache for 1 minute (short TTL since this data changes frequently)
}), claudeController.getConversationHistory);

/**
 * Clear conversation history for a user
 */
app.delete('/api/conversation-history/:userId', requireAuthentication, claudeController.clearConversationHistory);

/**
 * Get authenticated user information
 */
app.get('/api/user-info', requireAuthentication, mondayController.getUserInfo);

/**
 * Get boards for the authenticated user
 */
app.get('/api/boards', requireAuthentication, mondayController.getBoards);

/**
 * Get a specific board by ID
 */
app.get('/api/boards/:boardId', requireAuthentication, mondayController.getBoardById);

/**
 * Execute a GraphQL operation on Monday.com API
 */
app.post('/api/graphql', requireAuthentication, [
  body('query').isString().trim().notEmpty().withMessage('GraphQL query is required')
], mondayController.executeGraphQL);

/**
 * Get subscription status
 */
app.get('/api/subscription', subscriptionController.getSubscriptionStatus);

/**
 * Activate a subscription
 */
app.post('/api/subscription/activate', [
  body('userId').isString().trim().notEmpty().withMessage('User ID is required'),
  body('accountId').isString().trim().notEmpty().withMessage('Account ID is required'),
  body('plan').isString().trim().notEmpty().withMessage('Subscription plan is required')
], subscriptionController.activateSubscription);

/**
 * Deactivate a subscription
 */
app.post('/api/subscription/deactivate', [
  body('userId').isString().trim().notEmpty().withMessage('User ID is required'),
  body('accountId').isString().trim().notEmpty().withMessage('Account ID is required')
], subscriptionController.deactivateSubscription);

/**
 * Get usage statistics
 */
app.get('/api/usage', subscriptionController.getUsage);

// Serve static files from the client/build directory with caching
app.use(express.static('client/build', {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true, // Enable ETag header
  lastModified: true // Enable Last-Modified header
}));

/**
 * Metrics endpoint for Prometheus
 */
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).send('Error generating metrics');
  }
});

// Apply error handling middleware - must be after all routes
app.use(errorHandler);

// Start the server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${REGION} region`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Server started successfully`);
});

// Add graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');

  // Close Redis connection if it exists
  if (redisClient) {
    logger.info('Closing Redis connection');
    redisClient.quit().catch(err => {
      logger.error('Error closing Redis connection', { error: err });
    });
  }

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');

  // Close Redis connection if it exists
  if (redisClient) {
    logger.info('Closing Redis connection');
    redisClient.quit().catch(err => {
      logger.error('Error closing Redis connection', { error: err });
    });
  }

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });

  // Exit with error
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { reason });
});

// Export the app and server for testing
module.exports = { app, server };
