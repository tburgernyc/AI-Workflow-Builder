# Monday.com AI App Connector

A simple Express.js backend for a Monday.com app that handles OAuth authentication, webhooks, and provides a health check endpoint.

## Features

- Express.js server running on port 3000
- Health check endpoint at `/`
- Webhook handler at `/webhooks`
- OAuth callback at `/oauth/callback`
- Secure environment variable handling
- Centralized configuration

## Prerequisites

- Node.js 14.x or higher
- npm or yarn package manager
- Monday.com account with admin privileges
- ngrok (for local development)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd monday-AIApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` and fill in your credentials:
     - `MONDAY_CLIENT_ID`: Your Monday.com OAuth client ID
     - `MONDAY_CLIENT_SECRET`: Your Monday.com OAuth client secret
     - `MONDAY_SIGNING_SECRET`: Your Monday.com signing secret
     - `REDIRECT_URI`: Your OAuth callback URL

## Setting Up Your Monday.com App

1. Go to the [Monday.com Developer Center](https://monday.com/developers/apps)
2. Create a new app
3. In the "OAuth" section:
   - Add the redirect URL: `https://your-production-url.com/oauth/callback` (or your ngrok URL for local testing)
   - Note your Client ID and Client Secret
4. In the "Permissions" section, add the following permissions:
   - `boards:read`
   - `boards:write`
   - `users:read`
   - `updates:write`
5. In the "Features" section, add a webhook subscription with the URL: `https://your-production-url.com/webhooks`

## Running the App

### Local Development

1. Start the server:
   ```bash
   node simple-server.js
   ```

2. In a separate terminal, start ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```

3. Update your `.env` file with the ngrok URL:
   ```
   REDIRECT_URI=https://your-ngrok-url.ngrok-free.app/oauth/callback
   ```

4. Update your Monday.com app settings with the ngrok URL for:
   - Redirect URL
   - Webhook URL

### Production Deployment

1. Set up a server with Node.js installed
2. Clone the repository and install dependencies
3. Set up environment variables with production values
4. Use a process manager like PM2 to run the app:
   ```bash
   npm install -g pm2
   pm2 start simple-server.js
   ```
5. Set up a reverse proxy (like Nginx) to handle HTTPS

## OAuth Flow

The app implements the standard OAuth 2.0 flow for Monday.com:

1. User is redirected to Monday.com's authorization page
2. User grants permissions to the app
3. Monday.com redirects back to the app's `/oauth/callback` endpoint with an authorization code
4. The app exchanges the code for an access token by making a request to Monday.com's token endpoint
5. The app can now make authenticated requests to Monday.com's API using the access token

## Webhook Handling

The app provides a webhook endpoint at `/webhooks` that:

1. Receives POST requests from Monday.com
2. Logs the webhook payload to the console
3. Returns a 200 OK response

You can customize the webhook handler to process specific events from Monday.com, such as item creation, updates, or status changes.

## Marketplace Submission Checklist

Before submitting to the Monday.com marketplace:

1. Update the manifest.json file with your production URLs
2. Ensure all environment variables are properly set
3. Test the app thoroughly, including:
   - OAuth flow
   - Webhook handling
   - Error handling
4. Prepare marketing materials:
   - App icon
   - Screenshots
   - Detailed description
5. Review the [Monday.com Marketplace Guidelines](https://monday.com/developers/marketplace-guidelines)

## Security Considerations

- **NEVER commit API keys or secrets to version control**
- Store all credentials in environment variables
- Use `.env.example` with placeholders to document required variables
- Rotate any credentials that may have been exposed
- Ensure HTTPS is used in production

## License

This project is licensed under the MIT License - see the LICENSE file for details.
