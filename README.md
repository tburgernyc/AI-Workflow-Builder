# Monday.com Claude Integration App

A secure cloud-based integration that enables natural language processing for Monday.com workflows using Claude AI.

## Features

- Natural language processing for Monday.com tasks
- Document analysis and summarization
- Workflow automation through conversational interface
- Secure OAuth authentication with Monday.com
- Usage tracking and subscription management

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Monday.com account with admin privileges
- Claude API key from Anthropic

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tburgernyc/Monday.com-AIApp.git
   cd Monday.com-AIApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables and generate security keys:
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
   - Generate secure encryption keys:
   ```bash
   npm run generate-keys
   ```
   - Copy the generated ENCRYPTION_KEY and SESSION_SECRET values to your .env file
   - Edit `.env` and fill in your credentials:
     - `MONDAY_CLIENT_ID`: Your Monday.com OAuth client ID
     - `MONDAY_CLIENT_SECRET`: Your Monday.com OAuth client secret
     - `MONDAY_SIGNING_SECRET`: Your Monday.com signing secret
     - `MONDAY_API_TOKEN`: Your Monday.com API token
     - `CLAUDE_API_KEY`: Your Claude API key from Anthropic
     - `REGION`: Your Monday.com region (US or EU)

4. Start the development server:
   ```bash
   npm run dev
   ```

   Alternatively, you can use the setup script to install dependencies and generate keys in one step:
   ```bash
   npm run setup
   ```

### Environment Variables

The application requires several environment variables to be set. Copy the `.env.example` file to `.env` and fill in your values:

```env
# Monday.com OAuth credentials
MONDAY_CLIENT_ID=your_monday_client_id_here
MONDAY_CLIENT_SECRET=your_monday_client_secret_here
MONDAY_SIGNING_SECRET=your_monday_signing_secret_here
REDIRECT_URI=http://localhost:3000/oauth/callback

# Monday.com API token (for SDK authentication)
MONDAY_API_TOKEN=your_monday_api_token_here

# Claude AI API key (for AI assistant)
CLAUDE_API_KEY=your_claude_api_key_here

# Claude API configuration (optional, defaults provided in code)
CLAUDE_API_URL=https://api.anthropic.com/v1/messages
CLAUDE_API_VERSION=2023-06-01
CLAUDE_MODEL=claude-3-opus-20240229

# Server configuration
PORT=3001
NODE_ENV=development

# Region for API endpoints (US or EU)
REGION=US

# Security configuration (generate with npm run generate-keys)
ENCRYPTION_KEY=your_secure_encryption_key
SESSION_SECRET=your_secure_session_secret
ADMIN_API_KEY=your_secure_admin_api_key

# Redis configuration (optional, for distributed caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Monitoring configuration (optional)
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
```

## Usage

### Authentication

The app uses OAuth 2.0 for authentication with Monday.com. Users will be redirected to Monday.com to authorize the app, and then redirected back to the app with an authorization code.

### API Endpoints

#### Authentication Endpoints
- `/oauth/authorize`: Initiate OAuth flow with Monday.com
- `/oauth/callback`: OAuth callback endpoint
- `/api/user-info`: Get authenticated user information

#### Core Functionality Endpoints
- `/api/process-request`: Process a natural language request
- `/api/conversation-history/:userId`: Get conversation history for a user
- `/api/conversation-history/:userId`: DELETE - Clear conversation history
- `/api/process-document`: Process a document with Claude AI

#### Subscription and Monetization Endpoints
- `/api/subscription`: Get subscription status
- `/api/subscription/activate`: Activate a subscription
- `/api/subscription/deactivate`: Deactivate a subscription
- `/api/usage`: Get usage statistics

#### Health and Monitoring Endpoints
- `/health`: Health check endpoint
- `/metrics`: Prometheus metrics endpoint (protected)

## Development

### Project Structure

```bash
monday-AIApp/
├── client/                 # Frontend React application
│   ├── public/             # Static assets
│   └── src/                # React source code
│       ├── components/     # Reusable UI components
│       ├── context/        # React context providers
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       └── utils/          # Frontend utilities
├── middleware/             # Express middleware
│   ├── authMiddleware.js   # Authentication middleware
│   ├── securityMiddleware.js # Security headers and protections
│   ├── cacheMiddleware.js  # Response caching middleware
│   └── errorMiddleware.js  # Error handling middleware
├── monday-claude-utils/    # Utility functions for API integration
│   ├── enhanced-claudeAPI.js  # Claude API integration with retry logic
│   ├── mondayAPI.js        # Monday.com API integration
│   ├── requestQueue.js     # Request queue for API rate limiting
│   └── conversationManager.js # Conversation history management
├── scripts/                # Utility scripts
│   └── generate-keys.js    # Security key generator
├── tests/                  # Test files
│   ├── api.test.js         # API endpoint tests
│   ├── enhanced-claudeAPI.test.js # Claude API unit tests
│   ├── health.test.js      # Health check tests
│   └── setup.js            # Test setup configuration
├── utils/                  # Utility functions
│   ├── encryption.js       # Data encryption utilities
│   ├── tokenManager.js     # Token management utilities
│   └── validators.js       # Input validation utilities
├── .env.example            # Example environment variables
├── app.json                # Monday.com app configuration
├── config.js               # Centralized configuration
├── env-validator.js        # Environment variable validation
├── index.js                # Application entry point
├── manifest.json           # Monday.com marketplace manifest
├── monetization-routes.js  # Subscription management routes
├── oauth-routes.js         # OAuth authentication routes
├── package.json            # Node.js dependencies and scripts
├── README.md               # Project documentation
└── server.js               # Express server configuration
```

### Testing

Run tests with:

```bash
npm test
```

## Deployment

### Production Build

Create a production build with:

```bash
# Build the client application
npm run build:client

# Prepare for deployment
npm run mapps:deploy
```

### Deployment to Monday.com Marketplace

Before submitting to the Monday.com marketplace:

1. Ensure all tests pass:
   ```bash
   npm test
   ```

2. Validate the app locally:
   ```bash
   # Start the server and client concurrently
   npm run start:all

   # Test all features in the local environment
   ```

3. Deploy to Monday.com:
   ```bash
   # Deploy client and server
   npm run mapps:deploy

   # Check deployment status
   npm run mapps:status
   ```

4. Review security considerations:
   - Ensure all API keys are properly secured
   - Verify that all sensitive data is encrypted
   - Check that rate limiting is properly configured
   - Validate that all input is properly sanitized
   - Confirm that proper authentication is enforced

5. Prepare marketplace submission materials:
   - App icon (192x192px)
   - App screenshots (at least 3, 592x348px)
   - App description (short and long)
   - Privacy policy and terms of service
   - Support contact information
   - Pricing information

## Security Considerations

### API Key Security

- **NEVER commit API keys or secrets to version control**
- Store all credentials in environment variables
- Use `.env.example` with placeholders to document required variables
- Rotate any credentials that may have been exposed
- Use the `npm run generate-keys` script to create secure encryption keys

### Data Encryption

- All sensitive data is encrypted using AES-256-GCM
- Encryption keys are required and validated at startup
- Secure token generation for CSRF protection
- HMAC signatures for data integrity verification

### Authentication and Authorization

- OAuth flow is used for secure authentication with Monday.com
- Session tokens are validated on all protected endpoints
- Permission checks are performed for sensitive operations
- HTTPS is required for all communications
- Secure cookie handling with proper flags

### Rate Limiting and Protection

- Rate limiting is implemented to prevent abuse
- Exponential backoff with jitter for API retries
- Request queuing for high-traffic scenarios
- Input validation and sanitization on all endpoints
- Circuit breaker pattern for external API calls

### Monitoring and Logging

- Structured logging with appropriate log levels
- Performance metrics collection via Prometheus
- Real-time monitoring for security events
- Sensitive data is redacted from logs
- Detailed error tracking with unique error IDs

### Deployment Security

- Use GitHub Secrets for CI/CD credentials
- Separate environments for development, staging, and production
- Security scanning in the CI pipeline
- Regular dependency updates and vulnerability scanning
- Environment validation at application startup

## Additional Documentation

For detailed setup guides, please refer to the following resources:

### User and Developer Documentation

1. **[API Documentation](docs/API.md)** - Comprehensive API reference
2. **[Deployment Guide](docs/DEPLOYMENT.md)** - How to deploy the application
3. **[User Guide](docs/USER_GUIDE.md)** - How to use the application
4. **[Security Configuration](docs/SECURITY_CONFIGURATION.md)** - How to configure security features and best practices
5. **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Solutions for common issues

### Infrastructure and DevOps

1. **[GitHub Secrets Setup](docs/GITHUB_SECRETS_SETUP.md)** - How to securely store credentials for CI/CD pipelines
2. **[Prometheus Setup](docs/PROMETHEUS_SETUP.md)** - How to configure Prometheus to monitor your application
3. **[Redis Setup](docs/REDIS_SETUP.md)** - How to set up Redis for distributed caching

### Marketplace Submission

1. **[Marketplace Submission Guide](docs/MARKETPLACE_SUBMISSION.md)** - Guide for submitting to the Monday.com marketplace
2. **[Security Audit Report](docs/SECURITY_AUDIT.md)** - Comprehensive security audit report
3. **[Performance Testing Report](docs/PERFORMANCE_TESTING.md)** - Performance testing results and analysis
4. **[Validation Checklist](docs/VALIDATION_CHECKLIST.md)** - Final validation checklist before submission

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Monday.com](https://monday.com) for their excellent API
- [Anthropic](https://anthropic.com) for Claude AI
- All contributors to this project
