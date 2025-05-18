// Simple script to check if environment variables are loaded correctly
require('dotenv').config();

console.log('Environment variables:');
console.log('- MONDAY_CLIENT_ID:', process.env.MONDAY_CLIENT_ID ? 'Set' : 'Not set');
console.log('- MONDAY_CLIENT_SECRET:', process.env.MONDAY_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('- MONDAY_SIGNING_SECRET:', process.env.MONDAY_SIGNING_SECRET ? 'Set' : 'Not set');
console.log('- REDIRECT_URI:', process.env.REDIRECT_URI ? 'Set' : 'Not set');
console.log('- PORT:', process.env.PORT || '3000 (default)');
