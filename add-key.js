import readline from 'readline';
import dotenv from 'dotenv';
import ApiKey from './models/ApiKey.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptForApiKey() {
  return new Promise((resolve) => {
    rl.question('Please enter your Gemini API key: ', (apiKey) => {
      resolve(apiKey.trim());
    });
  });
}

async function addApiKey(key) {
  try {
    const existingKey = await ApiKey.findOne({ key });
    
    if (existingKey) {
      // Reactivate existing key if found
      existingKey.isActive = true;
      existingKey.failureCount = 0;
      existingKey.rateLimitResetAt = null;
      await existingKey.save();
      return console.log('✅ Existing API key reactivated successfully');
    }

    // Create new key
    await ApiKey.create({ key });
    console.log('✅ New API key added successfully');
  } catch (error) {
    console.error('❌ Error adding API key:', error.message);
  }
}

async function main() {
  const apiKey = await promptForApiKey();
  
  if (!apiKey) {
    console.error('❌ API key is required');
    process.exit(1);
  }

  await addApiKey(apiKey);
  rl.close();
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});