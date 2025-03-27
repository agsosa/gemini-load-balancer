require('dotenv').config();
const { spawn } = require('child_process');

const port = process.env.PORT || 4269;
const nextStart = spawn('next', ['start', '-p', port], { 
    stdio: 'inherit',
    shell: true 
});