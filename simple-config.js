/**
 * Centralized configuration for Monday.com app
 * This file loads environment variables and exports them as a configuration object
 */
require('dotenv').config();

module.exports = {
  clientId: process.env.MONDAY_CLIENT_ID,
  clientSecret: process.env.MONDAY_CLIENT_SECRET,
  signingSecret: process.env.MONDAY_SIGNING_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  port: process.env.PORT || 3000
};
