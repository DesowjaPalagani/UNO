# MongoDB Integration Guide

Complete guide for integrating MongoDB with your UNO Game Platform.

---

## Overview

MongoDB provides a flexible, scalable NoSQL database solution. The project now supports MongoDB through Prisma's MongoDB provider.

**Updated:** Prisma schema changed from SQLite to MongoDB provider.

---

## Local Development with MongoDB

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. **Create MongoDB Atlas Account**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create Project & Cluster**
   - Click "Create Project" → Name: `uno-game`
   - Click "Build a Database"
   - Select "M0 Sandbox" (free tier)
   - Cloud Provider: AWS
   - Region: Choose your preference
   - Click "Create Deployment"

3. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `uno_user`
   - Password: (auto-generate and copy)
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Select "Drivers"
   - Copy the connection string

6. **Set DATABASE_URL**
   ```bash
   # In backend/.env.dev
   DATABASE_URL="mongodb+srv://uno_user:YOUR_PASSWORD@cluster-name.xxxxx.mongodb.net/uno_game?retryWrites=true&w=majority"
   ```

### Option 2: Local MongoDB Installation

**On macOS (using Homebrew):**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh

# In backend/.env.dev
DATABASE_URL="mongodb://localhost:27017/uno_game"
```

**On Ubuntu/Linux:**
```bash
# Install MongoDB
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb

# Verify
mongosh

# In backend/.env.dev
DATABASE_URL="mongodb://localhost:27017/uno_game"
```

**Using Docker:**
```bash
# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Connection string
DATABASE_URL="mongodb://root:password@localhost:27017/uno_game?authSource=admin"
```

---

## Database Setup & Initialization

### Step 1: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### Step 2: Seed Database (Optional)

```bash
# This will create initial data
npx prisma db seed
```

### Step 3: Verify Connection

```bash
# Test from Node
npm run -C backend exec "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  (async () => {
    const userCount = await prisma.user.count();
    console.log('Users in database:', userCount);
    await prisma.\$disconnect();
  })();
"
```

---

## Development Workflow

### Start Backend with MongoDB

```bash
# From backend directory
npm run dev

# The backend will connect to MongoDB automatically
# Check for connection logs
```

### Start Frontend

```bash
# From frontend directory
npm run dev
```

### Access Application

- Frontend: http://localhost:3000
- Backend Health: http://localhost:5000/api/health
- Backend API: http://localhost:5000/api

---

## MongoDB Specific Features

### Document Structure

MongoDB stores data as documents (JSON-like). Your collections look like:

**Users Collection:**
```json
{
  "_id": "cuid123",
  "email": "user@example.com",
  "username": "john_doe",
  "password": "$hashed_password",
  "avatar": "https://...",
  "createdAt": "2026-03-10T10:00:00.000Z",
  "updatedAt": "2026-03-10T10:00:00.000Z"
}
```

**Games Collection:**
```json
{
  "_id": "cuid456",
  "code": "GAME123",
  "hostId": "cuid123",
  "players": ["cuid123", "cuid124"],
  "status": "IN_PROGRESS",
  "deck": "[...]",
  "discardPile": "[...]",
  "createdAt": "2026-03-10T10:00:00.000Z"
}
```

### Querying Data

```bash
# Connect to MongoDB
mongosh

# List databases
show dbs

# Use uno_game database
use uno_game

# Show collections
show collections

# Count users
db.User.countDocuments()

# Find user by email
db.User.findOne({ email: "user@example.com" })

# Find all games
db.Game.find().limit(5)

# Find active games
db.Game.find({ status: "IN_PROGRESS" })
```

---

## Indexing for Performance

MongoDB benefits from indexes on frequently queried fields. Prisma creates indexes automatically based on your schema.

**Manual Index Creation (if needed):**

```javascript
// In a migration or setup script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create indexes through Prisma
await prisma.$executeRawUnsafe(`
  db.User.createIndex({ email: 1 })
  db.Game.createIndex({ code: 1 })
  db.Game.createIndex({ hostId: 1 })
  db.GamePlayer.createIndex({ gameId: 1, userId: 1 })
`);
```

---

## Migration from PostgreSQL to MongoDB

If you're migrating existing data:

### Step 1: Export Data from PostgreSQL

```bash
# Dump PostgreSQL data
pg_dump -U postgres uno_game > postgres_backup.sql
```

### Step 2: Convert Data Format

The structure is similar, but you may need to:
- Update connection strings
- Ensure all IDs are strings (MongoDB uses ObjectId, but Prisma uses CUID)
- Verify relationship mappings

### Step 3: Import to MongoDB

```bash
# Using Prisma seed or manual import
cd backend
npx prisma db seed
```

---

## Production Deployment with MongoDB Atlas

### On AWS EC2

See `AWS_EC2_MONGODB_ATLAS_ALB_DEPLOYMENT.md` for complete instructions.

**Quick Setup:**

1. **Create MongoDB Atlas Cluster** (M1 or higher for production)
2. **Create Database User** with strong password
3. **Configure Network Access** (add EC2 security group)
4. **Set DATABASE_URL** in EC2 `.env` file
5. **Restart backend:** `pm2 restart uno-backend`

### Environment Variables

```env
# .env.prod
DATABASE_URL="mongodb+srv://uno_user:PASSWORD@cluster-name.xxxxx.mongodb.net/uno_game?retryWrites=true&w=majority"
```

---

## Backup & Recovery

### MongoDB Atlas Automated Backups

1. **Enable Backups**
   - MongoDB Atlas → Cluster → Backup
   - Snapshots are automatic

2. **Manual Backup**
   ```bash
   # Export data
   mongodump --uri "mongodb+srv://uno_user:password@cluster.mongodb.net/uno_game"
   ```

3. **Restore Data**
   ```bash
   # Import data
   mongorestore --uri "mongodb+srv://uno_user:password@cluster.mongodb.net/uno_game" \
     ./dump/uno_game
   ```

---

## Troubleshooting

### Connection Issues

**ERROR: connect ECONNREFUSED**
- MongoDB is not running
- Solution: Start MongoDB (see installation steps above)

**ERROR: MongoAuthenticationError**
- Wrong credentials
- Solution: Verify username/password in DATABASE_URL

**ERROR: IP address not whitelisted**
- On MongoDB Atlas only
- Solution: Add your IP to Network Access in MongoDB Atlas

### Performance Issues

**Slow Queries:**
```bash
# Enable profiling
mongosh
use uno_game
db.setProfilingLevel(1, { slowms: 100 })

# View slow queries
db.system.profile.find().limit(5).pretty()
```

**Memory Usage:**
- Monitor in MongoDB Atlas → Metrics
- Optimize queries and add indexes
- Scale cluster up if needed

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `MongoError: not authenticated` | Invalid credentials | Check DATABASE_URL |
| `MongoServerError: E11000 duplicate key` | Unique constraint violated | Check unique fields (email, username) |
| `MongooseServerSelectionError` | Cannot reach MongoDB | Verify connection string, network access |
| `BSON document too large` | Document > 16MB | Split into smaller documents |

---

## MongoDB-Specific Considerations

### Data Types

```javascript
// MongoDB has native support for:
- String
- Number (Int32, Int64, Double)
- Boolean
- Date
- Null
- Array
- Object/Document
- ObjectId (Prisma uses CUID instead)
- Binary
```

### Transactions

```javascript
// MongoDB 4.0+ supports ACID transactions (like PostgreSQL)
// Prisma handles this automatically for:
const result = await prisma.$transaction([
  prisma.user.create({ ... }),
  prisma.game.create({ ... }),
]);
```

### Aggregation

```javascript
// For complex queries, use aggregation pipeline
const results = await prisma.$queryRaw`
  db.Game.aggregate([
    { $match: { status: "FINISHED" } },
    { $group: { _id: "$hostId", total: { $sum: 1 } } }
  ])
`;
```

---

## Best Practices

1. **Use Indexes** - Add indexes to frequently queried fields
2. **Validate Schema** - Use Prisma validation before insert/update
3. **Connect Pooling** - Reuse Prisma Client instance
4. **Error Handling** - Catch MongoDB-specific errors
5. **Backups** - Enable automated backups on MongoDB Atlas
6. **Monitoring** - Monitor memory, CPU, connections
7. **TTL Indexes** - Use for temporary data cleanup

```javascript
// Example: Set data to expire after 7 days
model Session {
  id        String   @id
  data      Json
  createdAt DateTime @default(now()) @db.Expiresat(604800) // TTL in seconds
}
```

---

## Useful Commands

```bash
# Check Prisma client
npx prisma --version

# View Prisma schema
npx prisma format

# Generate new Prisma client
npx prisma generate

# Create seed data
npx prisma db seed

# Deploy migrations (MongoDB)
npx prisma migrate deploy

# Check connection
npm run dev

# View logs
pm2 logs uno-backend
```

---

## Resources

- **MongoDB Docs**: https://docs.mongodb.com
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Prisma MongoDB**: https://www.prisma.io/docs/reference/database-reference/mongodb
- **Prisma Client**: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
