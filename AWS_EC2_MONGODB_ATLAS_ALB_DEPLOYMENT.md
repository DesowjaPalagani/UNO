# AWS Deployment Guide: EC2 + MongoDB Atlas + ALB

A production-ready deployment architecture for the UNO Game Platform on AWS with MongoDB.

---

## Architecture Overview

```
Internet (HTTPS)
    ↓
AWS ALB (Application Load Balancer) - Port 443
    ↓
    ├─→ EC2 Backend Instances (Port 5000) - Multiple instances
    └─→ EC2 Frontend Instances (Port 3000) - Multiple instances
    ↓
MongoDB Atlas (Cloud Database)
```

---

## Part 1: Set Up MongoDB Atlas

### Step 1.1: Create MongoDB Atlas Account

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas

2. **Sign Up or Login**
   - Create account or login with existing credentials
   - Create organization if needed

### Step 1.2: Create MongoDB Cluster

1. **Create Project**
   - Click "Create Project"
   - Name: `uno-game-production`
   - Click "Create Project"

2. **Create Cluster**
   - Click "Build a Database"
   - Select **M0 Sandbox** (free tier for testing)
   - For production, select **M1** or higher
   - Cloud Provider: **AWS**
   - Region: **Same as your EC2 instances** (e.g., `us-east-1`)
   - Cluster Name: `uno-game-cluster`
   - Click "Create Deployment"

3. **Wait for Cluster Creation** (5-10 minutes)

### Step 1.3: Create Database User

1. **Go to Database Access**
   - Click "Database Access" in left sidebar

2. **Add Database User**
   - Click "Add New Database User"
   - **Username**: `uno_user`
   - **Password**: Generate strong password (copy it!)
   - **Database User Privileges**: 
     - Select "Built-in Role"
     - Choose: `Atlas admin`
   - Click "Add User"

### Step 1.4: Configure Network Access

1. **Go to Network Access**
   - Click "Network Access" in left sidebar

2. **Add IP Address**
   - Click "Add IP Address"
   - Option A (Flexible): 
     - Click "Allow Access from Anywhere"
     - Add entry: `0.0.0.0/0`
   - Option B (Secure, Recommended):
     - Add each EC2 instance's IP address individually
   - Click "Confirm"

### Step 1.5: Get MongoDB Connection String

1. **Go to Database Overview**
   - Click "Database" in left sidebar
   - Click "Connect" button on your cluster

2. **Choose Connection Method**
   - Select "Drivers"
   - Language: **Node.js**
   - Driver: **4.1 or later**

3. **Copy Connection String**
   ```
   mongodb+srv://uno_user:YOUR_PASSWORD@uno-game-cluster.xxxxx.mongodb.net/uno_game?retryWrites=true&w=majority
   ```

   Replace `YOUR_PASSWORD` with the password you created.

4. **Save Connection String** - You'll need it for EC2 setup

**Example Connection String:**
```
mongodb+srv://uno_user:MySecurePassword123@uno-game-cluster.abcd1234.mongodb.net/uno_game?retryWrites=true&w=majority
```

---

## Part 2: Set Up EC2 Instances (Same as PostgreSQL version)

### Step 2.1: Create Security Group for EC2

1. **Go to EC2 → Security Groups → Create Security Group**
   ```
   Name: uno-game-ec2-sg
   Description: UNO Game EC2 Security Group
   VPC: Default VPC
   ```

2. **Add Inbound Rules**
   ```
   Rule 1 - SSH:
   Type: SSH (22)
   Source: Your IP (or 0.0.0.0/0 for testing)
   
   Rule 2 - Backend:
   Type: Custom TCP
   Port: 5000
   Source: ALB Security Group (create next)
   
   Rule 3 - Frontend:
   Type: Custom TCP
   Port: 3000
   Source: ALB Security Group (create next)
   ```

### Step 2.2: Create ALB Security Group

1. **Create Security Group for ALB**
   ```
   Name: uno-game-alb-sg
   Description: UNO Game ALB Security Group
   ```

2. **Add Inbound Rules**
   ```
   Rule 1 - HTTP:
   Type: HTTP (80)
   Source: 0.0.0.0/0
   
   Rule 2 - HTTPS:
   Type: HTTPS (443)
   Source: 0.0.0.0/0
   ```

### Step 2.3: Create EC2 Instance for Backend

1. **Go to EC2 → Launch Instance**
   ```
   Name: uno-game-backend-1
   OS Image: Ubuntu Server 22.04 LTS
   Instance Type: t3.small (production) or t3.micro (dev)
   Key Pair: Create or select existing
   VPC: Default VPC
   Auto-assign Public IP: Yes
   Security Group: uno-game-ec2-sg
   Storage: 30 GB gp3
   ```

2. **Launch and Wait** - 2-3 minutes

3. **Connect via SSH**
   ```bash
   chmod 400 your-key-pair.pem
   ssh -i "your-key-pair.pem" ubuntu@YOUR_INSTANCE_PUBLIC_IP
   ```

### Step 2.4: Setup Backend on EC2 with MongoDB

Once SSH'd into backend EC2:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Clone repository
cd /var/www
sudo mkdir -p uno-game && cd uno-game
sudo git clone https://github.com/DesowjaPalagani/UNO.git .
sudo chown -R ubuntu:ubuntu /var/www/uno-game

# Create backend production environment file
cd /var/www/uno-game/backend
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_URL=mongodb+srv://uno_user:YOUR_PASSWORD@uno-game-cluster.xxxxx.mongodb.net/uno_game?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
SESSION_SECRET=your-super-secret-session-key-min-32-chars
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
SOCKET_NAMESPACE=/socket.io
SOCKET_ORIGINS=https://yourdomain.com
EOF

# Install dependencies
npm install --production

# Generate Prisma client for MongoDB
npx prisma generate

# Seed database (first instance only)
npx prisma db seed

# Build (if needed)
npm run build 2>/dev/null || true

# Create PM2 ecosystem file
cat > /var/www/uno-game/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'uno-backend',
      script: 'dist/server.js',
      cwd: '/var/www/uno-game/backend',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/uno-backend-error.log',
      out_file: '/var/log/uno-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
EOF

# Start with PM2
pm2 start /var/www/uno-game/ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Verify it's running
pm2 status
curl http://localhost:5000/api/health
```

### Step 2.5: Create EC2 Instance for Frontend

**Repeat Step 2.3**, but name it `uno-game-frontend-1`

Once SSH'd into frontend EC2:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git

# Install PM2
sudo npm install -g pm2

# Clone repository
cd /var/www
sudo mkdir -p uno-game && cd uno-game
sudo git clone https://github.com/DesowjaPalagani/UNO.git .
sudo chown -R ubuntu:ubuntu /var/www/uno-game

# Create frontend production environment file
cd /var/www/uno-game/frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_API_PREFIX=/api
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
NEXT_PUBLIC_DEBUG_MODE=false
EOF

# Install dependencies
npm install --production

# Build Next.js
npm run build

# Create PM2 ecosystem file
cat > /var/www/uno-game/ecosystem-frontend.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'uno-frontend',
      script: './node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/uno-game/frontend',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/uno-frontend-error.log',
      out_file: '/var/log/uno-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
EOF

# Start with PM2
pm2 start /var/www/uno-game/ecosystem-frontend.config.js
pm2 save
pm2 startup

# Verify it's running
pm2 status
curl http://localhost:3000
```

### Step 2.6: Create AMIs (Machine Images)

1. **For Backend EC2:**
   - Right-click instance → Image and templates → Create image
   - Name: `uno-game-backend-ami`
   - Wait for image

2. **For Frontend EC2:**
   - Right-click instance → Image and templates → Create image
   - Name: `uno-game-frontend-ami`
   - Wait for image

---

## Part 3: Set Up Application Load Balancer (ALB)

### Step 3.1: Create Load Balancer

1. **Go to EC2 → Load Balancers → Create Load Balancer**
   ```
   Type: Application Load Balancer
   Name: uno-game-alb
   Scheme: Internet-facing
   IP address type: IPv4
   ```

2. **Network Mapping**
   ```
   VPC: Default
   Availability Zones: Select at least 2
   ```

3. **Security Groups**
   - Select: `uno-game-alb-sg`

4. **Click Create Load Balancer**

### Step 3.2: Create Target Groups

**Backend Target Group:**
```
Name: uno-game-backend-tg
Protocol: HTTP
Port: 5000
Health Check Path: /api/health
```

**Frontend Target Group:**
```
Name: uno-game-frontend-tg
Protocol: HTTP
Port: 3000
Health Check Path: /
```

### Step 3.3: Configure ALB Listeners

1. **HTTP Listener** (Redirect to HTTPS)
   ```
   Port: 80
   Action: Redirect to HTTPS (port 443)
   ```

2. **HTTPS Listener** (Main)
   ```
   Port: 443
   Certificate: ACM certificate
   Default Action: Forward to uno-game-frontend-tg
   ```

3. **Path-based Routing**
   - Path `/api*` → Forward to backend-tg
   - Path `/socket.io*` → Forward to backend-tg

### Step 3.4: Setup SSL Certificate

1. **Request from AWS Certificate Manager**
   - Domain: `yourdomain.com` and `*.yourdomain.com`
   - Validation: DNS
   - Wait for validation

2. **Attach to ALB HTTPS listener**

---

## Part 4: DNS & Domain Configuration

1. **Get ALB DNS Name**
   - Go to Load Balancers → Copy DNS name

2. **Configure Domain DNS**
   - Add CNAME record pointing to ALB DNS

---

## Part 5: Auto Scaling (Optional)

### Create Launch Templates and Auto Scaling Groups

**Same process as PostgreSQL version** (using backend-ami and frontend-ami)

---

## Part 6: Monitoring MongoDB

### Step 6.1: MongoDB Atlas Monitoring

1. **Go to MongoDB Atlas → Cluster → Metrics**
   - Monitor CPU, Memory, Network
   - View query performance
   - Check connection count

2. **Enable Database Profiling**
   - Go to Cluster → More → Database Tools
   - Set profiling level to capture slow queries

### Step 6.2: CloudWatch Monitoring

1. **Create CloudWatch Dashboard**
   ```
   Name: uno-game-platform
   ```

2. **Add Widgets**
   - ALB Request Count
   - ALB Target Response Time
   - EC2 CPU Utilization
   - Connection to MongoDB Atlas

### Step 6.3: Set Up Alarms

```bash
# High CPU on EC2
Threshold: > 80%

# Unhealthy ALB Targets
Threshold: > 0

# MongoDB Atlas CPU
Go to Atlas → Alerts → Create Alert
```

---

## Part 7: MongoDB Atlas Backups

### Step 7.1: Enable Automated Backups

1. **Go to Cluster → Backup**
   - Click "Enable Backup"
   - Select backup frequency and retention

2. **Configure Backup**
   ```
   Backup Frequency: Every 6 hours
   Retention: 30 days
   ```

### Step 7.2: Manual Backup

1. **Go to Backup**
   - Click "Take Snapshot"
   - Name: `uno-game-backup-$(date +%Y%m%d)`

### Step 7.3: Restore from Backup

1. **Click "Restore" on snapshot**
   - Create new cluster or restore to existing
   - Follow prompts

---

## Part 8: Deployment Checklist

### Before Going Live:

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] Network access configured
- [ ] Connection string tested
- [ ] Backend EC2 deployed
- [ ] Frontend EC2 deployed
- [ ] ALB created with target groups
- [ ] SSL certificate configured
- [ ] DNS records updated
- [ ] Health checks passing
- [ ] Auto Scaling Groups created
- [ ] CloudWatch monitoring enabled
- [ ] MongoDB Atlas backups enabled
- [ ] Database seeded with initial data
- [ ] End-to-end testing complete

---

## Part 9: Useful Operations

### Connect to MongoDB from EC2 (for debugging)

```bash
# Install MongoDB CLI
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.9.0.tgz
tar -xvf mongodb-database-tools-*.tgz
export PATH=$PATH:~/mongodb-database-tools/bin

# Connect to MongoDB Atlas
mongosh "mongodb+srv://uno_user:YOUR_PASSWORD@uno-game-cluster.xxxxx.mongodb.net/uno_game"

# List collections
show collections

# View user count
db.User.countDocuments()

# View games
db.Game.find().pretty()
```

### Backup & Migration Commands

```bash
# Export data from MongoDB
mongodump --uri "mongodb+srv://uno_user:PASSWORD@cluster.mongodb.net/uno_game" \
  --out ./backup

# Import data to MongoDB
mongorestore --uri "mongodb+srv://uno_user:PASSWORD@cluster.mongodb.net/uno_game" \
  ./backup

# Verify connection
npm run -C /var/www/uno-game/backend exec "
  const prisma = require('./dist/prismaService').default;
  prisma.user.count().then(console.log);
"
```

---

## Part 10: MongoDB vs PostgreSQL Comparison

| Feature | MongoDB Atlas | PostgreSQL (RDS) |
|---------|--------------|-----------------|
| Cost | ~$30-60/month | ~$50-100/month |
| Setup Time | 5-10 minutes | 10-15 minutes |
| Scaling | Horizontal (easy) | Vertical (harder) |
| Backup | Automatic | Manual/Scheduled |
| Free Tier | Yes (M0) | No |
| ACID Transactions | Yes (4.x+) | Yes |
| Relationships | References | Foreign Keys |
| Query Performance | Document-based | SQL-based |

---

## Part 11: Cost Estimation (Monthly with MongoDB Atlas)

```
MongoDB Atlas (M0 Sandbox):      $0 (free tier)
MongoDB Atlas (M1 Production):   ~$57
EC2 Instances (2x t3.small):     ~$70
ALB:                             ~$20
Data Transfer:                   ~$10
Total:                           ~$157/month

Cost Savings:
- Use M0 for dev/testing: Free
- Use M1 for production: ~$57
- Much cheaper than RDS + EC2
```

---

## Part 12: Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused from EC2 | Check IP whitelist in MongoDB Atlas → Network Access |
| Slow queries | Enable query profiling in MongoDB Atlas → Database Tools |
| Connection timeout | Verify security groups, MongoDB IP whitelist |
| Data not persisting | Check DATABASE_URL format, credentials |
| High memory usage | Monitor in MongoDB Atlas → Metrics, optimize indexes |

---

## Environment Variables Summary

**Backend `.env` for MongoDB:**
```
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_URL=mongodb+srv://uno_user:PASSWORD@cluster-name.xxxxx.mongodb.net/uno_game?retryWrites=true&w=majority
JWT_SECRET=<generate-strong-secret>
SESSION_SECRET=<generate-strong-secret>
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
NEXT_PUBLIC_DEBUG_MODE=false
```

---

## Next Steps

1. **Monitor performance** for first week
2. **Configure auto-scaling policies** based on load
3. **Set up CI/CD pipeline** with GitHub Actions
4. **Configure WAF** for security
5. **Enable VPC Flow Logs** for network monitoring
6. **Set up log aggregation** (CloudWatch Logs)
