# Azure VM Deployment Guide for InternAI

## Step 1: Create Azure Virtual Machine

### 1.1 Log into Azure Portal
- Go to https://portal.azure.com
- Sign in with your Azure account

### 1.2 Create Virtual Machine
1. Click **"Create a resource"**
2. Search for **"Virtual Machine"** → Click **"Create"**
3. Configure basic settings:

```
Subscription: Your subscription
Resource Group: Create new → "internai-rg"
Virtual Machine Name: "internai-vm"
Region: Choose closest to your users (e.g., East US, West Europe)
Image: Ubuntu Server 22.04 LTS - x64 Gen2
Size: Standard_B2s (2 vCPUs, 4 GB RAM) - Good for MVP
```

### 1.3 Administrator Account
```
Authentication type: SSH public key
Username: azureuser (or your preferred username)
SSH public key source: Generate new key pair
Key pair name: internai-vm_key
```

### 1.4 Inbound Port Rules
**IMPORTANT**: Check these boxes:
- ✅ HTTP (80)
- ✅ HTTPS (443) 
- ✅ SSH (22)

### 1.5 Create VM
- Click **"Review + Create"**
- Click **"Create"**
- **Download the private key** when prompted (save as `  `)

## Step 2: Connect to Your VM

### 2.1 Get Connection Details
After VM creation:
1. Go to your VM in Azure Portal
2. Copy the **Public IP address** (save this - you'll need it for DNS)
3. Click **"Connect"** → **"SSH"**

### 2.2 Connect via SSH

**On Windows (using PowerShell/WSL):**
```bash
# Move the key file to a secure location
mv ~/Downloads/internai-key.pem ~/.ssh/
chmod 600 ~/.ssh/internai-key.pem

# Connect to your VM (replace with your public IP)
ssh -i ~/.ssh/internai-key.pem azureuser@YOUR_VM_PUBLIC_IP
```

**On Mac/Linux:**
```bash
# Set correct permissions
chmod 600 ~/Downloads/internai-key.pem

# Connect to VM
ssh -i ~/Downloads/internai-key.pem azureuser@YOUR_VM_PUBLIC_IP
```

## Step 3: Setup Server Environment

### 3.1 Update System
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip
```

### 3.2 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Test Docker installation
docker --version
```

### 3.3 Install Docker Compose
```bash
# Install Docker Compose
sudo apt install -y docker-compose

# Verify installation
docker-compose --version
```

## Step 4: Deploy Your Application

### 4.1 Clone Repository
```bash
# Clone your InternAI repository
git clone https://github.com/yourusername/InternAI.git
cd InternAI

# Verify files are there
ls -la
```

### 4.2 Create Environment File
```bash
# Copy template to .env
cp env.template .env

# Edit environment variables
nano .env
```

**Fill in your .env file with these values:**
```bash
# Database
POSTGRES_DB=internai_prod
POSTGRES_USER=internai_user
POSTGRES_PASSWORD=your_secure_password_here_123!

# Backend - Generate a secure secret key
SECRET_KEY=your_super_secret_key_minimum_32_characters_here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CORS - Use your domain (we'll update this later)
BACKEND_CORS_ORIGINS=http://YOUR_VM_PUBLIC_IP,https://yourdomain.com

# Frontend
VITE_API_BASE_URL=/api
```

**Save and exit:** `Ctrl+X` → `Y` → `Enter`

### 4.3 Generate Secret Key
```bash
# Generate a secure secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Copy the output and paste it as SECRET_KEY in .env
nano .env
```

## Step 5: Deploy Application

### 5.1 Build and Start Services
```bash
# Build and start all services
docker-compose up -d

# Check if all services are running
docker-compose ps
```

**Expected output:**
```
NAME                   COMMAND                  STATUS
internai_backend       "uvicorn app.main:ap…"   Up
internai_db            "docker-entrypoint.s…"   Up (healthy)
internai_frontend      "/docker-entrypoint.…"   Up
internai_adminer       "entrypoint.sh docke…"   Up
```

### 5.2 Check Logs
```bash
# Check all logs
docker-compose logs

# Check specific service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs db
```

### 5.3 Test Application
```bash
# Test if application is accessible
curl -I http://localhost

# Should return HTTP 200 or 301 redirect
```

## Step 6: Configure Azure Network Security Group

### 6.1 Open Required Ports
1. Go to Azure Portal → Your VM → **Networking**
2. Check that these inbound port rules exist:
   - Port 22 (SSH)
   - Port 80 (HTTP) 
   - Port 443 (HTTPS)

If missing, click **"Add inbound port rule"** and add them.

## Step 7: Test External Access

### 7.1 Get Your Public IP
```bash
# In Azure Portal, go to your VM and copy the Public IP
# Or run this command on your VM:
curl -4 icanhazip.com
```

### 7.2 Test Application Access
**From your local computer:**
```bash
# Test HTTP access (replace with your VM's public IP)
curl -I http://YOUR_VM_PUBLIC_IP

# Test in browser
# Go to: http://YOUR_VM_PUBLIC_IP
```

## Step 8: Database Setup

### 8.1 Run Database Migrations
```bash
# Enter the backend container
docker-compose exec backend bash

# Run migrations
alembic upgrade head

# Exit container
exit
```

### 8.2 Optional: Check Database
```bash
# Access Adminer (database admin tool)
# Go to: http://YOUR_VM_PUBLIC_IP:8080

# Login with:
# System: PostgreSQL
# Server: db
# Username: internai_user (from your .env)
# Password: your_secure_password_here_123! (from your .env)
# Database: internai_prod (from your .env)
```

## Step 9: Troubleshooting

### Common Issues and Solutions

**Services not starting:**
```bash
# Check Docker daemon
sudo systemctl status docker

# Restart Docker if needed
sudo systemctl restart docker

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

**Port access issues:**
```bash
# Check if ports are listening
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Check firewall (Ubuntu)
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

**Application errors:**
```bash
# Check container logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart specific service
docker-compose restart backend
```

## Step 10: Next Steps

After successful deployment:

1. ✅ **Save your VM's Public IP**: `_________________`
2. ✅ **Application accessible**: http://YOUR_VM_PUBLIC_IP
3. ✅ **Ready for DNS setup**: Point your domain to this IP
4. ✅ **Ready for SSL**: Run the SSL setup script

## Success Checklist

- [ ] VM created and accessible via SSH
- [ ] Docker and Docker Compose installed
- [ ] Application repository cloned
- [ ] Environment variables configured
- [ ] All Docker services running (`docker-compose ps`)
- [ ] Application accessible via public IP
- [ ] Database migrations completed
- [ ] Public IP address noted for DNS setup

**Your application should now be running at:** `http://YOUR_VM_PUBLIC_IP`

## Important Notes

1. **Keep your .env file secure** - Never commit it to git
2. **Note your Public IP** - You'll need it for DNS configuration
3. **Monitor resources** - Use `htop` to check CPU/memory usage
4. **Regular backups** - Set up database backups for production

Once your application is running successfully, we'll proceed with DNS configuration and SSL setup! 