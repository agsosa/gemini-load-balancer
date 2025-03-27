require('dotenv').config();
const { spawn, spawnSync } = require('child_process');

// First run next build
console.log('Building the application...');
const buildResult = spawnSync('next', ['build'], { 
    stdio: 'inherit',
    shell: true 
});

if (buildResult.status !== 0) {
    console.error('Build failed');
    process.exit(1);
}

// Then start the server
console.log('Starting the server...');
const port = process.env.PORT || 4269;
const nextStart = spawn('next', ['start', '-p', port], { 
    stdio: 'inherit',
    shell: true 
});