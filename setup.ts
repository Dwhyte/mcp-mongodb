import { writeFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('MCP MongoDB Server Setup\n');
  
  const mongoUri = await question('Enter your MongoDB URI (e.g., mongodb://localhost:27017): ');
  const dbName = await question('Enter your database name: ');
  
  const config = {
    mongodb: {
      uri: mongoUri,
      database: dbName
    }
  };
  
  writeFileSync('mcp-config.json', JSON.stringify(config, null, 2));
  console.log('\nConfiguration saved to mcp-config.json');
  console.log('You can now run: npm start');
  
  rl.close();
}

setup().catch(console.error);