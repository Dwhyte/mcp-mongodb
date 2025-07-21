# MCP MongoDB Server

An MCP (Model Context Protocol) server that provides tools to interact with MongoDB databases, specifically designed to query user collections.

## Features

- **Query Users**: Search and filter users with MongoDB queries
- **Get User by ID**: Retrieve specific users by their ID
- **Count Users**: Get total count of users with optional filtering
- **Flexible Filtering**: Support for MongoDB query operators
- **Sorting and Projection**: Advanced query capabilities

## Prerequisites

- Node.js 18+ 
- MongoDB instance (local or cloud)
- TypeScript knowledge

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your MongoDB connection details:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=your_database_name
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Usage

### Starting the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### Available Tools

#### 1. `query_users`
Query users with optional filters, sorting, and projection.

**Parameters:**
- `filter` (object, optional): MongoDB filter object
- `limit` (number, optional): Maximum results (default: 10)
- `sort` (object, optional): Sort criteria
- `projection` (object, optional): Fields to include/exclude

**Example:**
```json
{
  "filter": {"age": {"$gte": 25}},
  "limit": 5,
  "sort": {"name": 1},
  "projection": {"_id": 1, "name": 1, "email": 1}
}
```

#### 2. `get_user_by_id`
Retrieve a specific user by their ID.

**Parameters:**
- `userId` (string, required): The user ID to search for

**Example:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

#### 3. `count_users`
Count total users with optional filtering.

**Parameters:**
- `filter` (object, optional): MongoDB filter object

**Example:**
```json
{
  "filter": {"status": "active"}
}
```

## MongoDB Connection

The server supports various MongoDB connection types:

### Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=myapp
```

### MongoDB with Authentication
```env
MONGODB_URI=mongodb://username:password@localhost:27017/myapp
MONGODB_DB_NAME=myapp
```

### MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/myapp
MONGODB_DB_NAME=myapp
```

## Development

### Project Structure
```
├─
