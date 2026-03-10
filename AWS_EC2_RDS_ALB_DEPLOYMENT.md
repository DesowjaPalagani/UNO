# AWS Deployment Guide: EC2 + RDS + ALB

A production-ready deployment architecture for the UNO Game Platform on AWS.

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
AWS RDS PostgreSQL Database (Port 5432)
```

---

## Part 1: Set Up RDS PostgreSQL Database

### Step 1.1: Create RDS Instance

1. **Navigate to AWS RDS Console**
   - Go to AWS Console → RDS → Create Database

2. **Configure Database**
   ```
   Engine: PostgreSQL
   Version: 14.x or higher
   Template: Production
   DB Instance Identifier: uno-game-db
   Master Username: postgres
   Master Password: [Generate Strong Password - save it!]
   DB Instance Class: db.t3.micro (dev) or db.t3.small (production)
   Allocated Storage: 20 GB
   Storage Type: gp3
   ```

3. **Connectivity Settings**
   ```
   VPC: Default VPC (or create custom VPC)
   DB Subnet Group: Create new
   Public Accessibility: No (keep private)
   VPC Security Group: Create new (uno-game-db-sg)
   ```

4. **Database Options**
   ```
   Database Name: uno_game
   Database Port: 5432
   Backup Retention: 7 days
   Multi-AZ: Yes (for production)
   ```

5. **Click Create Database** - Wait 5-10 minutes for creation

### Step 1.2: Configure RDS Security Group

1. **Find RDS Instance in Console**
   - Copy the **Endpoint** (e.g., `uno-game-db.xxx.us-east-1.rds.amazonaws.com`)

2. **Edit RDS Security Group**
   - Go to Security Groups → uno-game-db-sg
   - Add Inbound Rule:
     ```
     Type: PostgreSQL
     Protocol: TCP
     Port: 5432
     Source: EC2 Security Group (we'll create this next)
     ```

### Step 1.3: Get RDS Connection String

```
postgresql://postgres:YOUR_PASSWORD@uno-game-db.xxx.us-east-1.rds.amazonaws.com:5432/uno_game
```

Save this for later! You'll need it for EC2 instances.

---

## Part 2: Set Up EC2 Instances

### Step 2.1: Create Security Group for EC2

1. **Go to EC2 → Security Groups → Create Security Group**
   ```
   Name: uno-game-ec2-sg
   Description: UNO Game EC2 Security Group
   VPC: Same VPC as RDS
   ```

2. **Add Inbound Rules**
   ```
   Rule 1 - SSH:
   Type: SSH (22)
   Source: Your IP (or 0.0.0.0/0 for testing only)
   
   Rule 2 - Backend:
   Type: Custom TCP
   Port: 5000
   Source: ALB Security Group (create below)
   
   Rule 3 - Frontend:
   Type: Custom TCP
   Port: 3000
   Source: ALB Security Group (create below)
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

3. **Add Outbound Rule**
   ```
   Type: All Traffic
   Destination: uno-game-ec2-sg (EC2 Security Group)
   ```

### Step 2.3: Create EC2 Instance for Backend

1. **Go to EC2 → Launch Instance**
   ```
   Name: uno-game-backend-1
   OS Image: Ubuntu Server 22.04 LTS
   Instance Type: t3.small (production) or t3.micro (dev)
   Key Pair: Create or select existing (download .pem file)
   VPC: Same as RDS
   Auto-assign Public IP: Yes
   Security Group: uno-game-ec2-sg
   Storage: 30 GB gp3
   ```

2. **Launch Instance and Wait** - 2-3 minutes to start

3. **Connect via SSH**
   ```bash
   chmod 400 your-key-pair.pem
   ssh -i "your-key-pair.pem" ubuntu@YOUR_INSTANCE_PUBLIC_IP
   ```

### Step 2.4: Setup Backend on EC2

Once SSH'd into the backend EC2:

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

# Clone your repository
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
DATABASE_URL=postgresql://postgres:YOUR_RDS_PASSWORD@uno-game-db.xxx.us-east-1.rds.amazonaws.com:5432/uno_game
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
SESSION_SECRET=your-super-secret-session-key-min-32-chars
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
SOCKET_NAMESPACE=/socket.io
SOCKET_ORIGINS=https://yourdomain.com
EOF

# Install dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Run database migrations (first instance only)
npx prisma migrate deploy
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

# Verify build
ls -la .next

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
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Verify it's running
pm2 status
curl http://localhost:3000
```

### Step 2.6: Create AMIs (Machine Images)

1. **For Backend EC2:**
   - Right-click instance → Image and templates → Create image
   - Name: `uno-game-backend-ami`
   - Wait for image to be available

2. **For Frontend EC2:**
   - Right-click instance → Image and templates → Create image
   - Name: `uno-game-frontend-ami`
   - Wait for image to be available

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
   VPC: Same as RDS and EC2
   Availability Zones: Select at least 2 (for high availability)
   ```

3. **Security Groups**
   - Select: `uno-game-alb-sg` (created earlier)

4. **Click Create Load Balancer**

### Step 3.2: Create Target Groups

**Create Backend Target Group:**

1. **Go to Target Groups → Create Target Group**
   ```
   Name: uno-game-backend-tg
   Protocol: HTTP
   Port: 5000
   VPC: Same as RDS
   Health Check Path: /api/health
   Health Check Port: 5000
   Healthy Threshold: 2
   Unhealthy Threshold: 3
   Timeout: 5 seconds
   Interval: 30 seconds
   ```

2. **Register Targets**
   - Select your backend EC2 instance(s)
   - Port: 5000
   - Click "Include as pending below"
   - Register targets

**Create Frontend Target Group:**

1. **Go to Target Groups → Create Target Group**
   ```
   Name: uno-game-frontend-tg
   Protocol: HTTP
   Port: 3000
   VPC: Same as RDS
   Health Check Path: /
   Health Check Port: 3000
   Healthy Threshold: 2
   Unhealthy Threshold: 3
   Timeout: 5 seconds
   Interval: 30 seconds
   ```

2. **Register Targets**
   - Select your frontend EC2 instance(s)
   - Port: 3000
   - Click "Include as pending below"
   - Register targets

### Step 3.3: Configure ALB Listeners

1. **Go to Load Balancers → uno-game-alb → Listeners**

2. **HTTP Listener (Redirect to HTTPS)**
   ```
   Protocol: HTTP
   Port: 80
   Default Action: Redirect to HTTPS (port 443)
   ```

3. **HTTPS Listener (Main)**
   ```
   Protocol: HTTPS
   Port: 443
   Certificate: Request from ACM or import existing
   Default Action: Forward to uno-game-frontend-tg
   ```

4. **Create Rules for API Routing**
   - Add Rule:
     ```
     IF: Path is /api* OR Host contains api
     THEN: Forward to uno-game-backend-tg
     
     IF: Path is /socket.io*
     THEN: Forward to uno-game-backend-tg
     ```

### Step 3.4: Setup SSL Certificate

1. **Request Certificate from AWS Certificate Manager (ACM)**
   - Go to ACM → Request Certificate
   - Domain: `yourdomain.com` and `*.yourdomain.com`
   - Validation: DNS
   - Create records in your DNS provider
   - Wait for validation (5-30 minutes)

2. **Attach to ALB**
   - Go to ALB Listeners
   - Edit HTTPS listener
   - Select the ACM certificate

---

## Part 4: DNS & Domain Configuration

### Step 4.1: Point Domain to ALB

1. **Get ALB DNS Name**
   - Go to Load Balancers → uno-game-alb
   - Copy DNS name (e.g., `uno-game-alb-xxx.us-east-1.elb.amazonaws.com`)

2. **Configure DNS Provider**
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Create CNAME record:
     ```
     yourdomain.com  CNAME  uno-game-alb-xxx.us-east-1.elb.amazonaws.com
     ```
   - Wait 15-60 minutes for DNS propagation

### Step 4.2: Test ALB

```bash
# Test frontend
curl https://yourdomain.com

# Test backend health
curl https://yourdomain.com/api/health

# Test socket
curl -i https://yourdomain.com/socket.io
```

---

## Part 5: Auto Scaling (Optional but Recommended)

### Step 5.1: Create Launch Templates

**Backend Launch Template:**

1. **Go to EC2 → Launch Templates → Create Launch Template**
   ```
   Name: uno-game-backend-template
   AMI: uno-game-backend-ami (created earlier)
   Instance Type: t3.small
   Key Pair: Your key pair
   Security Group: uno-game-ec2-sg
   IAM Instance Profile: ecsInstanceRole (optional, for CloudWatch logs)
   User Data: (leave empty, already configured in AMI)
   ```

**Frontend Launch Template:**

```
   Name: uno-game-frontend-template
   AMI: uno-game-frontend-ami
   Instance Type: t3.small
   Key Pair: Your key pair
   Security Group: uno-game-ec2-sg
```

### Step 5.2: Create Auto Scaling Groups

**Backend Auto Scaling Group:**

1. **Go to Auto Scaling → Create Auto Scaling Group**
   ```
   Name: uno-game-backend-asg
   Launch Template: uno-game-backend-template
   VPC: Same as RDS
   Subnets: Select all availability zones
   Load Balancer: uno-game-alb
   Target Group: uno-game-backend-tg
   Desired Capacity: 2
   Min Size: 1
   Max Size: 5
   Health Check Type: ELB
   Health Check Grace Period: 300 seconds
   ```

2. **Create**

**Frontend Auto Scaling Group:**

```
   Name: uno-game-frontend-asg
   Launch Template: uno-game-frontend-template
   VPC: Same as RDS
   Subnets: Select all availability zones
   Load Balancer: uno-game-alb
   Target Group: uno-game-frontend-tg
   Desired Capacity: 2
   Min Size: 1
   Max Size: 5
   Health Check Type: ELB
   Health Check Grace Period: 300 seconds
```

---

## Part 6: Monitoring & Logging

### Step 6.1: CloudWatch Monitoring

1. **Go to CloudWatch → Dashboards → Create Dashboard**
   ```
   Name: uno-game-platform
   ```

2. **Add Widgets**
   - ALB Request Count
   - ALB Target Response Time
   - EC2 CPU Utilization
   - EC2 Network In/Out
   - RDS CPU Utilization
   - RDS Database Connections

### Step 6.2: Set Up Alarms

```bash
# Go to CloudWatch → Alarms → Create Alarm

Alarm 1 - High CPU:
Metric: EC2 CPU Utilization
Threshold: > 80% for 5 minutes
Action: Send SNS notification

Alarm 2 - ALB Unhealthy Targets:
Metric: UnHealthyHostCount
Threshold: > 0
Action: Send SNS notification

Alarm 3 - RDS CPU:
Metric: RDS CPU Utilization
Threshold: > 75%
Action: Send SNS notification
```

### Step 6.3: Enable ALB Logging

1. **Go to Load Balancers → uno-game-alb → Edit attributes**
   ```
   Access logs: Enabled
   S3 bucket: Create or select existing
   Prefix: alb-logs
   ```

---

## Part 7: Database Backups & Maintenance

### Step 7.1: RDS Backup Configuration

1. **Go to RDS → uno-game-db → Modify**
   ```
   Backup Retention Period: 30 days
   Multi-AZ: Yes (if not already)
   Backup Window: 03:00-04:00 UTC
   Maintenance Window: sun:04:00-sun:05:00 UTC
   ```

2. **Enable Enhanced Monitoring**
   ```
   Granularity: 60 seconds
   IAM Role: Create new role
   ```

### Step 7.2: Create Manual Snapshot

```bash
# Go to RDS → Snapshots → Take Snapshot
Name: uno-game-backup-$(date +%Y%m%d)
```

---

## Part 8: Deployment Checklist

### Before Going Live:

- [ ] RDS Instance created and accessible
- [ ] Backend EC2 deployed and running
- [ ] Frontend EC2 deployed and running
- [ ] ALB created with target groups
- [ ] SSL certificate requested and validated
- [ ] DNS records configured
- [ ] ALB listeners configured
- [ ] Health checks passing
- [ ] Auto Scaling Groups created
- [ ] CloudWatch dashboards set up
- [ ] Alarms configured
- [ ] Database backups enabled
- [ ] Security groups configured correctly
- [ ] Test end-to-end functionality

### Testing Checklist:

- [ ] Frontend loads at https://yourdomain.com
- [ ] Backend health check responds
- [ ] User can register
- [ ] User can login
- [ ] Games can be created
- [ ] Web Socket connection works
- [ ] Database queries execute correctly
- [ ] Load balancer distributes traffic

---

## Part 9: Common Issues & Troubleshooting

| Issue | Solution |
|-------|----------|
| ALB returns 502 Bad Gateway | Check target group health, EC2 security group, app logs |
| Database connection fails | Verify RDS endpoint, security group, credentials |
| SSL certificate error | Check ACM certificate, ALB listener config |
| High latency | Check ALB cross-zone load balancing, EC2 instance performance |
| Auto Scaling not working | Check launch template, IAM roles, CloudWatch logs |
| Socket.io connection fails | Add socket.io rule to ALB listener, sticky sessions |

---

## Part 10: Cost Estimation (Monthly)

```
RDS PostgreSQL (db.t3.small):        ~$50
EC2 Instances (2x t3.small):         ~$70
ALB:                                 ~$20
Data Transfer:                       ~$10
Total:                               ~$150/month

Optimization Tips:
- Use db.t3.micro for dev (~$30)
- Use t3.micro EC2 for dev (~$10/month)
- Reserve instances for 1-3 year savings (30-70% discount)
```

---

## Useful AWS CLI Commands

```bash
# Deploy code to all backend instances
for instance in $(aws ec2 describe-instances --filters "Name=tag:Name,Values=uno-game-backend*" --query 'Reservations[*].Instances[*].InstanceId' --output text); do
  echo "Updating $instance..."
  aws ssm send-command \
    --instance-ids $instance \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["cd /var/www/uno-game && git pull && npm install && npm run build && pm2 restart all"]'
done

# Monitor ALB
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:region:account:targetgroup/uno-game-backend-tg/hash

# View RDS logs
aws rds describe-db-logs --db-instance-identifier uno-game-db
```

---

## Next Steps

1. **Monitor performance** for first week
2. **Configure auto-scaling policies** based on metrics
3. **Set up CI/CD pipeline** (GitHub Actions → AWS CodeDeploy)
4. **Configure WAF** (Web Application Firewall) for security
5. **Set up Route 53** for advanced routing (optional)
6. **Enable VPC Flow Logs** for network monitoring
