# UNO Game Platform - Manual Server Deployment Guide

## Prerequisites & Server Setup

### 1. Server Requirements
- **OS**: Ubuntu 20.04 LTS or higher / Debian 10+
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 10GB free disk space
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Database**: SQLite (bundled) or PostgreSQL (recommended for production)

### 2. Initial Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install sqlite3 (optional, useful for SQLite databases)
sudo apt install -y sqlite3
```

---

## Environment Variable Changes for Production

### Backend Production Configuration
Create `.env.prod` in `/backend` with these changes:

```env
# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Frontend URL (change to your domain)
FRONTEND_URL=https://yourdomain.com

# Database (switch to PostgreSQL for production)
DATABASE_URL="postgresql://user:password@localhost:5432/uno_game"

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

# Session
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Redis (optional, for session management)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=https://yourdomain.com

# Socket.io
SOCKET_NAMESPACE=/socket.io
SOCKET_ORIGINS=https://yourdomain.com
```

### Frontend Production Configuration
Create `.env.prod` in `/frontend`:

```env
# Environment
NEXT_PUBLIC_ENV=production

# API Configuration (change to your domain)
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_API_PREFIX=/api
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com

# Debug Mode
NEXT_PUBLIC_DEBUG_MODE=false
```

---

## Step-by-Step Deployment Process

### Step 1: Prepare Production Server
```bash
# SSH into your server
ssh user@your-server-ip

# Create app directory
sudo mkdir -p /var/www/uno-game
cd /var/www/uno-game

# Clone repository
sudo git clone https://github.com/DesowjaPalagani/UNO.git .

# Set proper permissions
sudo chown -R $USER:$USER /var/www/uno-game
```

### Step 2: Database Setup

**For SQLite (Simple, works for dev/small instance):**
```bash
cd /var/www/uno-game/backend
npx prisma migrate deploy
npx prisma db seed
```

**For PostgreSQL (Recommended for production):**
```bash
# Install PostgreSQL client
sudo apt install -y postgresql-client

# Connect to your PostgreSQL server and create database
psql -h postgres-host -U postgres
# Then run:
# CREATE DATABASE uno_game;
# CREATE USER uno_user WITH PASSWORD 'strong_password';
# GRANT ALL PRIVILEGES ON DATABASE uno_game TO uno_user;

# Update DATABASE_URL in .env.prod
# Then run migrations:
cd /var/www/uno-game/backend
npx prisma migrate deploy
npx prisma db seed
```

### Step 3: Backend Setup & Build
```bash
cd /var/www/uno-game/backend

# Copy production environment
cp .env.prod .env

# Install dependencies
npm install --production

# Build TypeScript (if needed)
npm run build

# Generate Prisma client
npx prisma generate

# Test backend
npm run dev  # Should start on port 5000
```

### Step 4: Frontend Setup & Build
```bash
cd /var/www/uno-game/frontend

# Copy production environment
cp .env.prod .env

# Install dependencies
npm install --production

# Build Next.js
npm run build

# Verify build success (creates .next folder)
ls -la .next
```

### Step 5: Setup PM2 Process Management

**Create PM2 Ecosystem File** (`/var/www/uno-game/ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: 'uno-backend',
      script: './backend/dist/server.js',
      cwd: '/var/www/uno-game',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'uno-frontend',
      script: './frontend/.next/standalone/server.js',
      cwd: '/var/www/uno-game',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

**Start with PM2:**
```bash
cd /var/www/uno-game

# Create logs directory
mkdir -p logs

# Start all apps
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 auto-restart on server reboot
pm2 startup systemd -u $USER --hp /home/$USER
```

### Step 6: Nginx Reverse Proxy Configuration

**Create Nginx Config** (`/etc/nginx/sites-available/uno-game`):
```nginx
upstream backend {
    server 127.0.0.1:5000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt with Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;
    gzip_min_length 1000;

    # Backend API proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Socket.io proxy
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable Nginx Configuration:**
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/uno-game /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl restart nginx
```

### Step 7: SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### Step 8: Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verify rules
sudo ufw status
```

### Step 9: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs uno-backend
pm2 logs uno-frontend

# Check Nginx
sudo systemctl status nginx

# Test endpoints
curl https://yourdomain.com/api/health
curl https://yourdomain.com

# Check open ports
sudo lsof -i -P -n | grep LISTEN
```

---

## Necessary Configuration Changes Checklist

### Before Deployment:

- [ ] **Change all `yourdomain.com` references** to your actual domain
- [ ] **Generate new JWT_SECRET** (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] **Generate new SESSION_SECRET** (same method as JWT_SECRET)
- [ ] **Update database URL** (PostgreSQL connection string if using)
- [ ] **Update CORS_ORIGIN** to match your domain
- [ ] **Update SOCKET_ORIGINS** to match your domain
- [ ] **Update FRONTEND_URL** in backend config
- [ ] **Set correct NODE_ENV=production** in both services
- [ ] **Review Nginx SSL paths** (match your domain name)
- [ ] **Update DNS records** to point to your server IP
- [ ] **Configure firewall** to allow ports 80, 443, 22

### Backend `.env.prod` Required Variables:
```
NODE_ENV=production
PORT=5000
DATABASE_URL=<your-database-url>
JWT_SECRET=<generate-strong-secret>
SESSION_SECRET=<generate-strong-secret>
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### Frontend `.env.prod` Required Variables:
```
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
NEXT_PUBLIC_DEBUG_MODE=false
```

---

## Post-Deployment Checks

```bash
# Verify services are running
pm2 list

# Check system resources
free -h
df -h

# Monitor logs in real-time
pm2 monit

# Check for errors
pm2 logs --err

# Verify SSL certificate
sudo certbot certificates
```

---

## Maintenance Commands

```bash
# Restart all services
pm2 restart all

# Stop services
pm2 stop all

# View logs
pm2 logs uno-backend
pm2 logs uno-frontend

# Update code and restart
cd /var/www/uno-game
git pull origin main
npm run build       # in both backend and frontend
pm2 restart all

# Backup database
mysqldump uno_game > backup-$(date +%Y%m%d).sql
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -i :PORT` and `kill -9 PID` |
| Nginx error | `sudo nginx -t` to test config |
| SSL not working | Check certificate paths, renew with Certbot |
| Database connection fails | Verify DATABASE_URL, check network connectivity |
| Services crash | Check logs with `pm2 logs`, verify env variables |
| High memory usage | Increase PM2 instances or optimize queries |

---

## Security Hardening (Optional)

```bash
# Update all packages regularly
sudo apt update && sudo apt upgrade -y

# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Limit SSH access
sudo nano /etc/ssh/sshd_config
# Add/modify: PermitRootLogin no, PasswordAuthentication no

# Setup fail2ban (prevent brute force)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

---

## Monitoring & Performance

```bash
# Install htop for system monitoring
sudo apt install -y htop

# Real-time monitoring
htop

# Check disk usage
du -sh /var/www/uno-game

# Monitor Nginx access logs
tail -f /var/log/nginx/access.log
```
