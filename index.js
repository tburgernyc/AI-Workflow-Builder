/**
 * Monday.com Claude Integration App
 *
 * This is the entry point for the application.
 * It loads the server and starts listening for requests.
 */

// Load the server
const server = require('./server');

// The server is already configured to start listening in server.js
console.log('Monday.com Claude Integration App started');

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
