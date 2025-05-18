// Monday.com App Backend
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// Import the centralized config module
const config = require('./config');

// Debug environment variables
console.log('Environment variables:');
console.log('- MONDAY_CLIENT_ID:', process.env.MONDAY_CLIENT_ID ? 'Set' : 'Not set');
console.log('- MONDAY_CLIENT_SECRET:', process.env.MONDAY_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('- MONDAY_SIGNING_SECRET:', process.env.MONDAY_SIGNING_SECRET ? 'Set' : 'Not set');
console.log('- REDIRECT_URI:', process.env.REDIRECT_URI ? 'Set' : 'Not set');
console.log('- PORT:', process.env.PORT || '3000 (default)');

// Validate environment variables before starting the server
if (!config.validateEnv()) {
  console.error('Server startup aborted due to missing environment variables');
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
app.use(bodyParser.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
  res.status(200).send('Monday.com App is running!');
});

/**
 * Webhook endpoint
 * Handles incoming webhooks from Monday.com
 */
app.post('/webhooks', (req, res) => {
  console.log('Received webhook payload:', JSON.stringify(req.body, null, 2));
  res.status(200).send('OK');
});

/**
 * OAuth callback endpoint
 * Handles the OAuth flow from Monday.com
 */
app.get('/oauth/callback', async (req, res) => {
  try {
    const { code } = req.query;

    console.log('OAuth callback received with code:', code);
    console.log('Full query string:', req.query);

    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    // Exchange the temporary code for a permanent access token
    try {
      const tokenResponse = await axios.post('https://auth.monday.com/oauth2/token', {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        redirect_uri: config.redirectUri
      });

      const { access_token } = tokenResponse.data;

      // In a real app, you would store this token securely
      console.log('Successfully obtained access token');

      // Redirect to a success page or back to the app
      res.send('Authorization successful! You can close this window.');
    } catch (error) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      res.status(500).send('Failed to exchange authorization code for token');
    }
  } catch (error) {
    console.error('OAuth callback error:', error.message);
    res.status(500).send('An unexpected error occurred');
  }
});

// Start the server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
