# MongoDB Atlas - Step-by-Step Setup Guide

Complete beginner-friendly guide to create MongoDB project and database.

---

## Step 1: Create MongoDB Atlas Account

### 1.1 Go to MongoDB Atlas Website
- Open browser and visit: **https://www.mongodb.com/cloud/atlas**
- Click the **"Try Free"** button (top right)

### 1.2 Sign Up
You can sign up with:
- Email address
- Google account
- GitHub account

**I recommend: Google or GitHub** (faster)

Choose method and complete sign up.

---

## Step 2: Create Organization (if needed)

After signing up, you'll see:

```
Welcome to MongoDB

Create an organization → [Fill in details]
Organization Name: UNO Game (or your choice)
Click "Create Organization"
```

---

## Step 3: Create Project

### 3.1 Create New Project
```
New Project → [Click Button]
Project Name: UNO Game Platform (or your choice)
Click "Create Project"
```

You should now be in your project dashboard.

---

## Step 4: Create Cluster (Database Server)

### 4.1 Build a Database
```
Click "Build a Database" button
```

### 4.2 Select Deployment Type

You'll see 3 options:

```
1️⃣ Dedicated Cluster    ← For production (paid)
2️⃣ Shared Cluster       ← Best option (free or low cost)
3️⃣ Serverless Instance  ← For serverless (newer)
```

**Select: Shared Cluster** (M0 Free tier)

### 4.3 Configure Cluster

Fill in these fields:

```
Cloud Provider:        AWS (or your preference)
Region:               us-east-1 (choose closest to you)
                      - US East (N. Virginia): us-east-1 ✓
                      - Europe (Ireland): eu-west-1
                      - Asia Pacific (Tokyo): ap-northeast-1

Cluster Tier:         M0 Sandbox (FREE) ✓
Backup:               Disable (free tier doesn't support)
Cluster Name:         uno-game-cluster
```

### 4.4 Click "Create Deployment"

⏳ **Wait 5-10 minutes** for cluster to be created (you'll see a loading bar)

---

## Step 5: Create Database User (Credentials)

### 5.1 Go to Database Access

While cluster is being created:
```
Left sidebar → "Database Access"
OR
Click "Add a Database User" button
```

### 5.2 Create User

```
Authentication Method:    Password ✓

Username:                 uno_user
                         (You'll use this to connect)

Password:                 [Click "Autogenerate Secure Password"]
                         (Copy and SAVE this password!)
                         Example: A7x#mK9$vL2pQ4@Rw8

Confirm Password:         [Auto-filled]

Built-in Role:           Atlas admin ✓
```

### 5.3 Click "Add User"

✅ User created successfully!

**⚠️ IMPORTANT: Copy and save the password somewhere safe!**

---

## Step 6: Configure Network Access

### 6.1 Go to Network Access

```
Left sidebar → "Network Access"
```

### 6.2 Add IP Address

**Option A: Allow Everyone (For Dev/Testing)**
```
"Add IP Address" → "Allow Access from Anywhere"
IP Address: 0.0.0.0/0 (entire internet)
Click "Confirm"
```

**Option B: Add Specific IPs (More Secure)**
```
"Add IP Address" → [Enter your IP]
Check: https://whatismyipaddress.com
Example: 123.45.67.89
Click "Confirm"

Repeat for other IPs (office, EC2 instances, etc.)
```

**For AWS EC2:** You'll add EC2 security group later.

---

## Step 7: Get Connection String

### 7.1 Wait for Cluster

Go back to **"Database"** tab
- Cluster should now be ready (green checkmark)

### 7.2 Click "Connect"

```
"Cluster" → Click "Connect" button
```

### 7.3 Choose Connection Method

```
Select: "Drivers"
Language: Node.js
Driver: 4.1 or later
```

### 7.4 Copy Connection String

You'll see:
```
mongodb+srv://<username>:<password>@<cluster-name>.<xxxxx>.mongodb.net/?retryWrites=true&w=majority
```

**Example (with your details):**
```
mongodb+srv://uno_user:A7x#mK9$vL2pQ4@Rw8@uno-game-cluster.abcd1234.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 8: Replace Credentials in Connection String

The string needs your username and password:

### Find and Replace:

1. **Find:** `<username>`
   **Replace with:** `uno_user`

2. **Find:** `<password>`
   **Replace with:** Your password (the one you copied earlier)

3. **Find:** `<cluster-name>`
   **Replace with:** `uno-game-cluster` (or your cluster name)

### Final Connection String Example:
```
mongodb+srv://uno_user:A7x#mK9$vL2pQ4@Rw8@uno-game-cluster.abcd1234.mongodb.net/?retryWrites=true&w=majority
```

**⚠️ WARNING: Never share this connection string! It has your password!**

---

## Step 9: Create Database

### 9.1 Go to Databases

```
Left sidebar → "Databases"
```

### 9.2 Create Database

Click on your cluster, then:

```
"Create Database" button
Database Name:     uno_game
Collection Name:   users (optional, can create later)
```

Click "Create"

✅ Database created!

---

## Step 10: Use Connection String in Project

### For Local Development:

**Edit: `backend/.env.dev`**

```
DATABASE_URL="mongodb+srv://uno_user:A7x#mK9$vL2pQ4@Rw8@uno-game-cluster.abcd1234.mongodb.net/uno_game?retryWrites=true&w=majority"
```

### For Production:

**Edit: `backend/.env.prod`**

```
DATABASE_URL="mongodb+srv://uno_user:A7x#mK9$vL2pQ4@Rw8@uno-game-cluster.abcd1234.mongodb.net/uno_game?retryWrites=true&w=majority"
```

---

## Step 11: Test Connection

### From Your Local Machine:

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Verify connection
npm run dev

# You should see:
# ✅ Successfully connected to MongoDB
# listening on port 5000
```

### Or Test with MongoDB CLI:

```bash
# Install mongosh (MongoDB CLI)
# Visit: https://www.mongodb.com/try/download/shell

# Connect
mongosh "mongodb+srv://uno_user:A7x#mK9$vL2pQ4@Rw8@uno-game-cluster.abcd1234.mongodb.net/uno_game"

# If successful, you'll see:
# uno_game>

# List collections
show collections

# Exit
exit
```

---

## Step 12: Seed Initial Data (Optional)

```bash
# From backend directory
cd backend

# Run seed
npx prisma db seed

# This creates sample data:
# - 2 test users
# - 1 sample game
```

---

## Troubleshooting

### Error: "Connection refused"

**Cause:** IP address not whitelisted

**Fix:**
1. Go to Network Access
2. Add your current IP: https://whatismyipaddress.com
3. Add `0.0.0.0/0` for testing (less secure)

### Error: "Authentication failed"

**Cause:** Wrong password

**Fix:**
1. Go to Database Access
2. Click menu on user → "Edit Password"
3. Generate new password
4. Update connection string

### Error: "Cannot find cluster"

**Cause:** Cluster name misspelled

**Fix:**
1. Go to Databases
2. Copy exact cluster name from connection string
3. Update in .env file

### "Cluster is paused"

**Cause:** Free M0 clusters pause after 60 days of inactivity

**Fix:**
1. Click on cluster
2. Click "Resume" button
3. Wait 5 minutes

---

## MongoDB Atlas Dashboard Overview

### What You'll See:

```
Left Sidebar:
├── Deployments
│   └── Databases ← Your clusters
├── Data Services
│   └── Atlas Search
├── Administration
│   ├── Database Access ← Users & passwords
│   ├── Network Access ← IP whitelist
│   ├── Organization Access ← Team management
│   └── Billing
└── Support

Top Section:
├── Metrics ← Performance monitoring
├── Monitoring ← Database health
├── Backup ← Snapshots & recovery
└── Activity → Check what happened
```

---

## Quick Reference

### Important Information to Save:

```
Organization Name:     UNO Game
Project Name:          UNO Game Platform
Cluster Name:          uno-game-cluster
Database Name:         uno_game
Username:              uno_user
Password:              A7x#mK9$vL2pQ4@Rw8
Connection String:     mongodb+srv://uno_user:A7x#mK9$vL2pQ4@Rw8@uno-game-cluster.abcd1234.mongodb.net/uno_game?retryWrites=true&w=majority

Cluster Region:        us-east-1
Tier:                  M0 Sandbox (Free)
```

---

## Next Steps

1. **Add your connection string** to `.env.dev`
2. **Run `npm run dev`** to start backend
3. **Create a collection** (optional, Prisma does this)
4. **Seed sample data**: `npx prisma db seed`
5. **Start building!**

---

## Upgrade Later?

### Free M0 Tier Limitations:
- 512 MB storage
- Shared computing
- No advanced monitoring
- Pauses after 60 days

### To Upgrade:

```
Cluster → $0 (Free) → Select Tier

M1 Tier:      $57/month
- 10 GB storage
- Dedicated compute
- 24/7 monitoring
- Always running
```

---

## Security Best Practices

1. **Never commit passwords to Git**
   ```bash
   # Add to .gitignore
   echo ".env*" >> .gitignore
   ```

2. **Use environment variables**
   ```bash
   # Don't hardcode in code
   # Use process.env.DATABASE_URL
   ```

3. **Rotate passwords regularly**
   ```
   MongoDB Atlas → Database Access → Edit Password
   Every 90 days recommended
   ```

4. **Use strong passwords**
   - Use auto-generated passwords (12+ characters)
   - Include special characters, numbers, uppercase

5. **Limit network access**
   ```
   Don't use 0.0.0.0/0 in production
   Add specific IPs only
   ```

---

## Common Commands

```bash
# Generate Prisma client
npx prisma generate

# Seed database
npx prisma db seed

# View database
mongosh "your-connection-string"

# Check collections
db.User.countDocuments()
db.Game.find().limit(5)

# Clear all data
db.User.deleteMany({})
db.Game.deleteMany({})
```

---

## Support

- **MongoDB Docs:** https://docs.mongodb.com
- **MongoDB Forum:** https://www.mongodb.com/community/forums
- **Prisma MongoDB:** https://www.prisma.io/docs/reference/database-reference/mongodb
- **Status:** https://status.mongodb.com
