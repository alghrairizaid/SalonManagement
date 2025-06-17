#!/usr/bin/env node

/**
 * This is a launcher script to ensure the server runs correctly in Replit
 */

const { spawn } = require('child_process');

console.log('Starting Manicure Salon application...');

// Start the Node.js application process
const child = spawn('node', ['app.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: 5000 }
});

child.on('close', (code) => {
  console.log(`Node.js application exited with code ${code}`);
});
