import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMCP() {
  console.log('🧪 Testing MCP MongoDB Server...\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/server.js']
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // List tools
    console.log('📋 Available tools:');
    const tools = await client.listTools();
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test 1: Count all users
    console.log('🔍 Test 1: Counting all users...');
    const countResult = await client.callTool({
      name: 'count_users',
      arguments: {}
    });
    console.log('Result:', countResult.content[0].text);
    console.log('');

    // Test 2: Query active users
    console.log('🔍 Test 2: Querying active users...');
    const activeUsersResult = await client.callTool({
      name: 'query_users',
      arguments: {
        filter: { status: 'active' },
        limit: 3
      }
    });
    console.log('Result:', activeUsersResult.content[0].text);
    console.log('');

    // Test 3: Get first user (we'll need to query first, then get by ID)
    console.log('🔍 Test 3: Getting first user by ID...');
    const firstUserResult = await client.callTool({
      name: 'query_users',
      arguments: {
        limit: 1
      }
    });
    
    // Parse the result to get the first user's ID
    const resultText = firstUserResult.content[0].text;
    const usersMatch = resultText.match(/Found \d+ users:\s*\n\n(\[.*\])/s);
    
    if (usersMatch) {
      try {
        const users = JSON.parse(usersMatch[1]);
        if (users.length > 0) {
          const firstUserId = users[0]._id;
          console.log(`Found user ID: ${firstUserId}`);
          
          const userResult = await client.callTool({
            name: 'get_user_by_id',
            arguments: {
              userId: firstUserId
            }
          });
          console.log('Result:', userResult.content[0].text);
        }
      } catch (parseError) {
        console.log('Could not parse user data for ID test');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testMCP().catch(console.error); 