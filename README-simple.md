# Monday.com AI App Connector

A simple Express.js backend for a Monday.com app that handles OAuth authentication, webhooks, and provides a health check endpoint.

## Features

- Express.js server running on port 3000
- Health check endpoint at `/`
- Webhook handler at `/webhooks`
- OAuth callback at `/oauth/callback`
- Includes a `manifest.json` file for Monday.com app configuration

## Prerequisites

- Node.js (v14 or higher)
- npm
- A Monday.com developer account
- ngrok (for local testing)

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd monday-AIApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Update the values in `.env` with your Monday.com app credentials

## Setting Up Your Monday.com App

1. Go to the [Monday.com Developer Center](https://monday.com/developers/apps)
2. Create a new app
3. In the "OAuth" section:
   - Add the redirect URL: `https://<your-ngrok-url>/oauth/callback`
   - Note your Client ID and Client Secret
4. In the "Permissions" section, add the following permissions:
   - `boards:read`
   - `boards:write`
   - `users:read`
   - `updates:write`
5. In the "Features" section, add a webhook subscription with the URL: `https://<your-ngrok-url>/webhooks`

## Running the App Locally

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
   REDIRECT_URI=https://<your-ngrok-url>/oauth/callback
   ```

4. Update your Monday.com app settings with the ngrok URL for:
   - Redirect URL
   - Webhook URL
   - Update the manifest.json file with your ngrok URL

## Testing the App

### Health Check
- Visit `https://<your-ngrok-url>/` in your browser
- You should see "Monday.com App is running!"

### OAuth Flow
1. Install your app on a Monday.com workspace
2. The OAuth flow will redirect to your callback URL
3. Check the server logs to see the authorization code and token exchange

### Webhooks
1. Perform actions in Monday.com that trigger your webhook
2. Check the server logs to see the webhook payload

## Environment Variables

The application requires the following environment variables:

```
# Monday.com OAuth credentials
MONDAY_CLIENT_ID=your_monday_client_id
MONDAY_CLIENT_SECRET=your_monday_client_secret
MONDAY_SIGNING_SECRET=your_monday_signing_secret
REDIRECT_URI=https://<replace-with-ngrok-url>/oauth/callback

# Server port (set to 3000 as required)
PORT=3000
```

## License

[MIT](LICENSE)
