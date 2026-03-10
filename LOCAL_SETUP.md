# 🚀 UNO Game Platform - Local Development Setup Guide

**Status**: Both backend and frontend are configured and ready to run locally.

---

## ✅ What's Ready

### Backend
- ✅ TypeScript compilation successful
- ✅ Prisma ORM configured and generated
- ✅ All services implemented
- ✅ Ready to start on port 5000
- ⚠️ **Requires**: PostgreSQL 15 + Redis 7

### Frontend  
- ✅ Next.js build successful
- ✅ Components fully implemented
- ✅ Ready to start on port 3000
- ✅ No external dependencies required

---

## 📋 Prerequisites

### Option A: Using Docker (Recommended - Simplest)
```bash
# Install Docker Desktop for Mac
# https://www.docker.com/products/docker-desktop

# Verify Docker is running
docker --version
docker-compose --version
```

### Option B: Install Locally

**PostgreSQL 15**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
psql -U postgres -l  # Verify connection
```

**Redis 7**
```bash
# Using Homebrew
brew install redis
redis-server  # Start in one terminal or:
brew services start redis
redis-cli ping  # Verify connection (should reply "PONG")
```

---

## 🐳 Start with Docker (Recommended)

```bash
cd /Users/desowjapalagani/Desktop/uno-game-platform

# Start PostgreSQL + Redis containers
docker-compose up -d

# Verify containers are running
docker-compose ps
```

Output should show:
```
NAME                COMMAND                  SERVICE      STATUS
postgres            docker-entrypoint.s...   postgres     Up
redis               docker-entrypoint.s...   redis        Up
```

---

## 🖥️ Start Backend

```bash
cd /Users/desowjapalagani/Desktop/uno-game-platform/backend

# Generate Prisma client (if not already done)
npx prisma generate

# Create database and run migrations
npx prisma migrate deploy || npx prisma migrate dev

# Optional: Seed with test data
npx prisma db seed

# Start development server
npm run dev
```

**Expected Output:**
```
[INFO] 17:xx:xx ts-node-dev ver. 2.0.0
🎮 UNO Game Platform Server
📡 Server running on port 5000
🌐 Environment: development
💾 Database: postgres
🔴 Redis: redis://localhost:6379

✅ Server started successfully
```

**Access:**
- API Health Check: http://localhost:5000/api/health
- WebSocket: ws://localhost:5000

---

## 🎨 Start Frontend

**In a new terminal:**

```bash
cd /Users/desowjapalagani/Desktop/uno-game-platform/frontend

# Start development server (auto-opens browser)
npm run dev
```

**Expected Output:**
```
   ▲ Next.js 13.5.0
   - Local:        http://localhost:3000
   - Environments: .env.local

✅ Ready in 0.5s
```

**Access:**
- Frontend: http://localhost:3000
- Landing Page: Shows "🎮 UNO" with Sign In / Create Account buttons

---

## ✅ Verify Everything is Running

### Check Backend (Terminal 1)
```bash
# Terminal 1 shows: "Server running on port 5000"
curl http://localhost:5000/api/health
# Response: {"status":"ok","timestamp":"..."}
```

### Check Frontend (Terminal 2)
```bash
# Browser automatically opens http://localhost:3000
# Should show UNO landing page
```

### Check Ports
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :5000
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

---

##  Troubleshooting

### Issue: "Port 5000 already in use"
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

### Issue: "Port 3000 already in use"
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Issue: "PostgreSQL connection refused"
```bash
# Start PostgreSQL if using local installation
brew services start postgresql@15

# Or if using Docker
docker-compose up -d postgres

# Verify connection
psql -U postgres -l
```

### Issue: "Redis connection refused"  
```bash
# Start Redis if using local installation
redis-server

# Or if using Docker
docker-compose up -d redis

# Verify connection
redis-cli ping
# Should return: PONG
```

### Issue: "Prisma client error"
```bash
cd backend

# Regenerate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### Issue: Backend crashes after starting
```bash
# Check .env file has correct DATABASE_URL
cat .env

# Example .env:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/uno_game_db"
# REDIS_URL="redis://localhost:6379"
```

---

## 🔄 Full Startup Script

Create a file `start-local.sh`:

```bash
#!/bin/bash

echo "🚀 Starting UNO Game Platform..."

# Change to project root
cd /Users/desowjapalagani/Desktop/uno-game-platform

# Check if Docker containers are running
echo "📦 Checking Docker containers..."
docker-compose ps

# If containers not running, start them
if [ $? -ne 0 ]; then
    echo "🐳 Starting Docker containers..."
    docker-compose up -d
    sleep 3
fi

# Terminal 1: Backend
echo "📡 Starting backend server..."
tmux new-session -d -s backend -c ./backend "npm run dev"

# Wait for backend to start
sleep 3

# Terminal 2: Frontend
echo "🎨 Starting frontend server..."
tmux new-session -d -s frontend -c ./frontend "npm run dev"

echo "✅ All servers starting..."
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "Postgres: localhost:5432"
echo "Redis:    localhost:6379"
echo ""
echo "View logs:"
echo "  tmux attach-session -t backend"
echo "  tmux attach-session -t frontend"
```

Make executable and run:
```bash
chmod +x start-local.sh
./start-local.sh
```

---

## 📝 Development Workflow

### To work on Backend
```bash
cd backend
npm run dev

# The server automatically restarts when files change
# Edit files in src/ and changes appear immediately
```

### To work on Frontend
```bash
cd frontend
npm run dev

# The page automatically reloads when files change
# Edit files in src/ and changes appear immediately
```

### To debug game logic
```bash
# Backend terminal
# Add console.logs to:
# - src/services/gameService.ts
# - src/utils/gameLogic.ts
# - src/services/socketService.ts
# Logs appear in terminal
```

---

## 🧪 Test Game Flow Locally

1. **Open browser**: http://localhost:3000
2. **Click "Create Account"**
   - Email: user1@test.com
   - Password: test123
3. **Open second browser tab**: http://localhost:3000
4. **Click "Sign In"**  
   - Email: user2@test.com (or repeat registration)
5. **Create a game** in tab 1
6. **Join the game** in tab 2
7. **Start the game**
8. **Play cards in real-time** across both tabs

---

## 🚀 Next Steps After Getting Local Running

1. **Create auth login pages** (pages/login.tsx, pages/register.tsx)
2. **Create lobby page** (pages/lobby.tsx)
3. **Create game page** (pages/game/[gameId].tsx)
4. **Test full multiplayer flow**
5. **Deploy to production**

---

## 📞 Quick Commands Reference

```bash
# Start everything
docker-compose up -d           # Start DB + Redis
npm run dev                     # Backend (in backend/ folder)
npm run dev                     # Frontend (in frontend/ folder)

# Database operations
npx prisma generate            # Generate types
npx prisma migrate dev          # Create/update migrations
npx prisma db seed              # Seed test data
npx prisma studio              # Open DB UI (http://localhost:5555)

# Kill servers
pkill -f "next dev"            # Kill frontend  
pkill -f "ts-node-dev"         # Kill backend
docker-compose down             # Stop DB + Redis

# Check status
curl http://localhost:5000/api/health  # Backend health
lsof -i :3000                  # Check port 3000
lsof -i :5000                  # Check port 5000
```

---

## ✨ Success Criteria

✅ You've got it working when:
- Frontend loads at http://localhost:3000
- Backend health check works: `curl http://localhost:5000/api/health`
- Can sign up and log in
- Database and Redis are connected
- No errors in terminal

---

**Happy coding! 🎮**
