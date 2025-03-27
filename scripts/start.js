import 'dotenv/config';
import { spawn } from 'child_process';
import process from 'process'; // Explicitly import process

// Start the server
console.log('Starting the server...');
const port = process.env.PORT || 4269; // Use process.env directly
const nextStart = spawn('next', ['start', '-p', port.toString()], { // Ensure port is a string
    stdio: 'inherit',
    shell: true 
});

// Optional: Handle exit signals for graceful shutdown if needed
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down...');
  nextStart.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down...');
  nextStart.kill('SIGTERM');
  process.exit(0);
});
