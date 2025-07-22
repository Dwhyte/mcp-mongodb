import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from "dotenv";
import express from 'express';
import { MongoClient } from "mongodb";

dotenv.config();

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'test';

let mongoClient: MongoClient;

async function connectToMongoDB() {
  try {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Tool definitions
const tools = [
    {
        name: 'query_users',
        description: 'Query users from the MongoDB users collection with optional filters',
        inputSchema: {
            type: 'object',
            properties: {
                filter: {
                    type: 'object',
                    description: 'MongoDB filter object (optional)',
                    additionalProperties: true,
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of users to return (default: 10)',
                    default: 10
                },
                sort: {
                    type: 'object',
                    description: 'Sort criteria (optional)',
                    additionalProperties: true
                },
                projection: {
                    type: 'object',
                    description: 'Fields to include/exclude (optional)',
                    additionalProperties: true
                }
            },
            required: []
        }
    },
      {
    name: 'get_user_by_id',
    description: 'Get a specific user by their ID',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The user ID to search for'
        }
      },
      required: ['userId']
    }
  },
    {
    name: 'count_users',
    description: 'Count users in the collection with optional filter',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          description: 'MongoDB filter object (optional)',
          additionalProperties: true
        }
      },
      required: []
    }
  }
];

// Tool implementations
async function handleQueryUsers(args: any) {
    try {
     const db = mongoClient.db(dbName);
     const collection = db.collection('users');

     const filter = args.filter || {};
     const limit = args.limit || 10;
     const sort = args.sort || {};
     const projection = args.projection || {};

     const cursor = collection.find(filter, { projection});
     if (Object.keys(sort).length > 0) {
        cursor.sort(sort);
     }
     cursor.limit(limit);

     const users = await cursor.toArray();

     return {
        content: [
            {
                type: 'text',
                text: `Found ${users.length} users:\n\n${JSON.stringify(users, null, 2)}`
            }
        ],
     }
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error querying users: ${error instanceof Error ? error.message : String(error)}`
                }
            ],
            isError: true,
        }
    }
}

async function handleGetUserById(args: any) {
    try {
        const db = mongoClient.db(dbName);
        const collection = db.collection('users');

        const user = await collection.findOne({ _id: args.userId });

    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: `User with ID ${args.userId} not found`
          }
        ]
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `User found:\n\n${JSON.stringify(user, null, 2)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error getting user: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

async function handleCountUsers(args: any) {
  try {
    const db = mongoClient.db(dbName);
    const collection = db.collection('users');
    
    const filter = args.filter || {};
    const count = await collection.countDocuments(filter);
    
    return {
      content: [
        {
          type: 'text',
          text: `Total users count: ${count}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error counting users: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

// Create and configure the MCP server
function createServer() {
    const server = new Server({
        name: 'mcp-mongodb-server',
        version: '1.0.0',
        description: 'A MongoDB server that can be used to query and manipulate MongoDB databases',
    });

    // Handle list tools request
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools
        };
    });

    // Handle call tool request
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        
        switch (name) {
            case 'query_users':
                return await handleQueryUsers(args);
            case 'get_user_by_id':
                return await handleGetUserById(args);
            case 'count_users':
                return await handleCountUsers(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    });

    return server;
}

// Main server setup
async function main() {
    await connectToMongoDB();

    // Check if we should run HTTP server or stdio
    const isHttpMode = process.argv.includes('--http') || process.env.MCP_MODE === 'http';
    
    if (isHttpMode) {
        // HTTP/SSE mode
        const server = createServer();
        const app = express();
        app.use(express.json());

        // Store transports for each session
        const transports: Record<string, SSEServerTransport> = {};

        // SSE endpoint for MCP
        app.get('/sse', async (req, res) => {
            const sessionId = req.query.sessionId as string || 'default';
            
            const transport = new SSEServerTransport('/messages', res);
            transports[sessionId] = transport;
            
            res.on('close', () => {
                delete transports[sessionId];
            });
            
            await server.connect(transport);
        });

        // Message endpoint for SSE
        app.post('/messages', async (req, res) => {
            const sessionId = req.query.sessionId as string;
            const transport = transports[sessionId];
            
            if (transport) {
                await transport.handlePostMessage(req, res);
            } else {
                res.status(400).json({ error: 'No transport found for sessionId' });
            }
        });

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                server: 'mcp-mongodb-server',
                version: '1.0.0',
                tools: tools.map(t => t.name),
                endpoints: {
                    sse: '/sse',
                    messages: '/messages',
                    health: '/health',
                    test: '/test'
                }
            });
        });

        // Simple test endpoint
        app.get('/test', async (req, res) => {
            try {
                const db = mongoClient.db(dbName);
                const collection = db.collection('users');
                const count = await collection.countDocuments();

                console.log("users count", count);
                res.json({ 
                    message: 'MCP MongoDB Server is running!',
                    userCount: count,
                    availableTools: tools.map(t => t.name),
                    sseEndpoint: '/sse'
                });
            } catch (error) {
                res.status(500).json({ error: 'Database connection failed' });
            }
        });

        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(` MCP MongoDB Server (HTTP) running on http://localhost:${port}`);
            console.log(` Health check: http://localhost:${port}/health`);
            console.log(`🧪 Test endpoint: http://localhost:${port}/test`);
            console.log(` SSE endpoint: http://localhost:${port}/sse`);
            console.log(` Messages endpoint: http://localhost:${port}/messages`);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoClient.close();
            process.exit(0);
        });
    } else {
        // Stdio mode (for Claude Desktop)
        const server = createServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoClient.close();
            process.exit(0);
        });
    }
}

main().catch(console.error);
