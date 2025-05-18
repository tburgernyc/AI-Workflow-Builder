// Simple test script to check if the server can start
console.log('Starting test script...');

try {
  // Import the config module
  const config = require('./config');
  console.log('Config module loaded successfully');
  
  // Check environment variables
  console.log('Environment variables:');
  console.log('- MONDAY_CLIENT_ID:', process.env.MONDAY_CLIENT_ID ? 'Set' : 'Not set');
  console.log('- MONDAY_CLIENT_SECRET:', process.env.MONDAY_CLIENT_SECRET ? 'Set' : 'Not set');
  console.log('- MONDAY_SIGNING_SECRET:', process.env.MONDAY_SIGNING_SECRET ? 'Set' : 'Not set');
  console.log('- REDIRECT_URI:', process.env.REDIRECT_URI ? 'Set' : 'Not set');
  console.log('- PORT:', process.env.PORT || '3000 (default)');
  
  // Try to create an Express app
  const express = require('express');
  console.log('Express module loaded successfully');
  
  const app = express();
  console.log('Express app created successfully');
  
  // Try to start the server on a different port
  const PORT = 3001;
  const server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    
    // Close the server after 1 second
    setTimeout(() => {
      server.close(() => {
        console.log('Test server closed successfully');
      });
    }, 1000);
  });
} catch (error) {
  console.error('Error in test script:', error);
}
