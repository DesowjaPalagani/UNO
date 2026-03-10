# 🎮 UNO Game Platform

A fully functional real-time multiplayer UNO web application built with modern technologies.

## Features

### Gameplay
- ✅ 2-10 player multiplayer games
- ✅ Real-time synchronized gameplay with WebSocket
- ✅ Complete UNO rules implementation
- ✅ Server-authoritative game engine
- ✅ Support for all card types: Number, Skip, Reverse, Draw Two, Wild, Wild Draw Four
- ✅ UNO declaration system with penalties
- ✅ Game winner detection
- ✅ Player statistics and leaderboard

### Features
- ✅ User authentication with JWT
- ✅ Public matchmaking
- ✅ Private rooms with room codes
- ✅ Real-time chat during games
- ✅ Player profiles with avatars
- ✅ Game history and statistics
- ✅ Mobile responsive design
- ✅ Accessible UI with ARIA labels

### Technical
- ✅ Server-side game validation
- ✅ Redis-based game state caching
- ✅ PostgreSQL persistent storage
- ✅ Docker containerization
- ✅ Horizontal scalability ready
- ✅ Framer Motion animations
- ✅ TailwindCSS styling

## Tech Stack

### Frontend
- **Framework**: Next.js 13+ with React 18
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Real-time**: Socket.io Client
- **State Management**: Zustand
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **Language**: TypeScript

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Environment**: Node 18+, PostgreSQL 15, Redis 7

## Project Structure

```
uno-game-platform/
├── backend/                 # Express + Socket.io server
│   ├── src/
│   │   ├── server.ts       # Main server entry point
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Game logic utilities
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Next.js React app
│   ├── src/
│   │   ├── pages/          # Next.js pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   └── styles/         # Global styles
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml       # Multi-container setup
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Or manually: PostgreSQL 15, Redis 7

### Option 1: Docker Compose (Recommended)

1. **Clone and setup**:
   ```bash
   cd uno-game-platform
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```

2. **Update environment variables** (optional):
   ```bash
   # backend/.env
   DATABASE_URL="postgresql://uno_user:uno_password@postgres:5432/uno_game_db"
   REDIS_URL="redis://redis:6379"
   JWT_SECRET="your-secret-key"
   ```

3. **Start all services**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Socket.io: ws://localhost:5000

5. **Run database migrations**:
   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```

### Option 2: Local Development

#### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Update database URL in .env
# DATABASE_URL="postgresql://user:password@localhost:5432/uno_game_db"
# REDIS_URL="redis://localhost:6379"

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local

# Start development server
npm run dev
```

Visit http://localhost:3000 to access the application.

## API Documentation

### Authentication

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username"
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Games

#### Create Game
```bash
POST /api/games
Authorization: Bearer token
Content-Type: application/json

{
  "name": "My Game",
  "isPublic": true,
  "maxPlayers": 10
}
```

#### Get Game
```bash
GET /api/games/:gameId
```

#### Join Game
```bash
POST /api/games/:gameId/join
Authorization: Bearer token
```

#### Start Game
```bash
POST /api/games/:gameId/start
Authorization: Bearer token
```

### WebSocket Events

#### Join Game
```javascript
socket.emit('join_game', {
  gameId: 'game_id',
  userId: 'user_id',
  username: 'username',
  avatar: 'avatar_url'
}, callback);
```

#### Play Card
```javascript
socket.emit('play_card', {
  gameId: 'game_id',
  playerId: 'player_id',
  card: { id: 'card_id', color: 'red', value: 5 },
  selectedColor: 'blue' // For wild cards
}, callback);
```

#### Draw Card
```javascript
socket.emit('draw_card', {
  gameId: 'game_id',
  playerId: 'player_id'
}, callback);
```

#### Declare UNO
```javascript
socket.emit('declare_uno', {
  gameId: 'game_id',
  playerId: 'player_id'
}, callback);
```

#### Send Message
```javascript
socket.emit('send_message', {
  gameId: 'game_id',
  username: 'username',
  message: 'message text'
}, callback);
```

## Game Rules

The UNO game follows standard rules:

1. **Card Play**: Match card by color, number, or symbol
2. **Action Cards**:
   - **Skip**: Next player loses their turn
   - **Reverse**: Changes direction of play
   - **Draw Two**: Next player draws 2 cards and loses turn
3. **Wild Cards**:
   - **Wild**: Change color, play anytime
   - **Wild Draw Four**: Change color, next player draws 4 cards
4. **UNO**: Must declare when down to 1 card
5. **Penalty**: Failure to declare UNO = draw 2 cards
6. **Winner**: First player to empty their hand wins

## Configuration

### Backend Environment Variables
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/uno_game_db

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Performance & Scaling

### Caching Strategy
- Game state cached in Redis
- Player sessions stored in Redis
- Database queries optimized with Prisma

### Scalability
- Stateless backend (game state in Redis)
- Multiple backend instances supported
- Redis cluster compatible
- Database connection pooling

### Load Testing
For production deployment, use:
- PM2 for process management
- Nginx reverse proxy
- Redis cluster for high availability
- Database read replicas

## Security

### Implemented
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ CORS configured
- ✅ Environment variables for secrets
- ✅ Prepared statements (Prisma ORM)
- ✅ Input validation

### Recommendations
- Use HTTPS in production
- Implement rate limiting
- Add CSRF protection
- Use environment variable vaults
- Enable database encryption
- Implement audit logging

## Deployment

### Using Docker

1. **Build images**:
   ```bash
   docker build -t uno-backend ./backend
   docker build -t uno-frontend ./frontend
   ```

2. **Push to registry**:
   ```bash
   docker tag uno-backend your-registry/uno-backend:latest
   docker push your-registry/uno-backend:latest
   ```

3. **Deploy to cloud**:
   - AWS ECS/Fargate
   - Google Cloud Run
   - Digital Ocean App Platform
   - Heroku
   - Render

### Kubernetes

See `kubernetes/` folder for Helm charts (to be added)

## Troubleshooting

### WebSocket Connection Issues
- Ensure Socket.io CORS is configured
- Check firewall rules
- Verify backend is running

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Redis Connection Issues
- Verify Redis is running on port 6379
- Check REDIS_URL format
- Clear Redis cache: `redis-cli FLUSHALL`

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review game rules implementation

## Changelog

### v1.0.0
- Initial release
- Complete game implementation
- Real-time multiplayer with Socket.io
- User authentication
- Game statistics
- Docker deployment ready
