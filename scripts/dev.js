require('dotenv').config();
const { spawn } = require('child_process');

const port = process.env.PORT || 4269;
const nextDev = spawn('next', ['dev', '-p', port], { 
    stdio: 'inherit',
    shell: true 
});