import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from "dotenv";
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
]

// Tool implementation
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

// Main server setup
async function main() {
    await connectToMongoDB();

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

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoClient.close();
    process.exit(0);
  });
}

main().catch(console.error);
