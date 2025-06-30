# Complete SSL Certificate Setup Guide

## Prerequisites Checklist
- [ ] Domain name registered (e.g., myapp.com)
- [ ] Domain DNS pointing to your Azure VM IP
- [ ] Azure VM with Ubuntu/Linux running
- [ ] Ports 80 and 443 open in Azure Network Security Group
- [ ] SSH access to your Azure VM

## Method 1: Let's Encrypt (FREE - Recommended)

### Step 1: Server Preparation
```bash
# SSH into your Azure VM
ssh your-username@your-vm-ip

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required tools
sudo apt install -y certbot curl
```

### Step 2: Verify Domain Points to Server
```bash
# Check if domain resolves to your server IP
nslookup yourdomain.com

# Should show your Azure VM's public IP
# If not, update your DNS A record first!
```

### Step 3: Clone and Setup Project
```bash
# Clone your project (if not already done)
git clone https://github.com/yourusername/InternAI.git
cd InternAI

# Install Docker if needed
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose -y
```

### Step 4: Initial Application Start
```bash
# Create environment file
cp env.template .env

# Edit .env with your values
nano .env

# Start application temporarily (needed for certificate verification)
docker-compose up -d

# Verify app is running
curl -I http://yourdomain.com
```

### Step 5: Generate SSL Certificate
```bash
# Create certificate directories
mkdir -p ssl-certs certbot-challenges

# Generate certificate with Let's Encrypt
sudo certbot certonly \
    --webroot \
    --webroot-path=./certbot-challenges \
    --email your-email@yourdomain.com \
    --agree-tos \
    --no-eff-email \
    --domains yourdomain.com

# If you have www subdomain, add it:
# --domains yourdomain.com,www.yourdomain.com
```

### Step 6: Copy Certificates to Project
```bash
# Copy certificates from system to project
sudo cp -r /etc/letsencrypt ./ssl-certs/
sudo chown -R $USER:$USER ./ssl-certs/

# Verify certificates exist
ls -la ssl-certs/live/yourdomain.com/
# Should show: fullchain.pem, privkey.pem, cert.pem, chain.pem
```

### Step 7: Update Configuration
```bash
# Update nginx configuration with your domain
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' frontend/nginx.conf
sed -i 's/server_name _;/server_name yourdomain.com;/g' frontend/nginx.conf

# Update .env file with HTTPS URLs
nano .env
# Set: BACKEND_CORS_ORIGINS=https://yourdomain.com
```

### Step 8: Restart with SSL
```bash
# Stop current containers
docker-compose down

# Start with SSL configuration
docker-compose up -d

# Check all services are running
docker-compose ps
```

### Step 9: Test SSL Setup
```bash
# Test HTTPS access
curl -I https://yourdomain.com

# Test HTTP to HTTPS redirect
curl -I http://yourdomain.com

# Test API proxy
curl -I https://yourdomain.com/api/

# Run validation script
./validate-deployment.sh yourdomain.com
```

### Step 10: Setup Auto-Renewal
```bash
# Add cron job for automatic renewal
(crontab -l 2>/dev/null; echo "0 2 * * * certbot renew --quiet && docker-compose restart frontend") | crontab -

# Test renewal (dry run)
sudo certbot renew --dry-run
```

## Method 2: Automated Script (Easiest)

### Single Command Setup
```bash
# Make script executable
chmod +x setup-ssl.sh

# Run automated setup (replace with your domain and email)
./setup-ssl.sh yourdomain.com admin@yourdomain.com

# Validate deployment
./validate-deployment.sh yourdomain.com
```

## Method 3: Cloudflare SSL (FREE Alternative)

### Step 1: Cloudflare Account Setup
1. Create account at cloudflare.com
2. Add your domain to Cloudflare
3. Update nameservers at your domain registrar

### Step 2: SSL Configuration
1. Go to SSL/TLS → Overview
2. Set SSL mode to "Full (strict)"
3. Go to SSL/TLS → Origin Server
4. Click "Create Certificate"

### Step 3: Download and Install
```bash
# Create certificate directory
mkdir -p ssl-certs/live/yourdomain.com

# Copy the certificate content to files
nano ssl-certs/live/yourdomain.com/fullchain.pem
# Paste the certificate content

nano ssl-certs/live/yourdomain.com/privkey.pem
# Paste the private key content

# Update nginx config
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' frontend/nginx.conf
sed -i 's/server_name _;/server_name yourdomain.com;/g' frontend/nginx.conf

# Restart application
docker-compose down && docker-compose up -d
```

## Method 4: Azure App Service Certificate (Paid)

### Step 1: Purchase Certificate
1. Azure Portal → App Service Certificates
2. Create new certificate
3. Select your domain
4. Complete verification process

### Step 2: Export and Convert
```bash
# Download .pfx file from Azure Portal
# Convert to PEM format
openssl pkcs12 -in your-cert.pfx -out fullchain.pem -nodes
openssl pkcs12 -in your-cert.pfx -out privkey.pem -nodes -nocerts

# Place in correct directory
mkdir -p ssl-certs/live/yourdomain.com
cp fullchain.pem ssl-certs/live/yourdomain.com/
cp privkey.pem ssl-certs/live/yourdomain.com/
```

## Troubleshooting Common Issues

### Certificate Generation Fails
```bash
# Check if domain resolves correctly
dig yourdomain.com

# Check if port 80 is accessible
curl -I http://yourdomain.com

# Check Docker containers are running
docker-compose ps

# Check nginx logs
docker-compose logs frontend
```

### Permission Issues
```bash
# Fix ownership of certificate files
sudo chown -R $USER:$USER ./ssl-certs/

# Check file permissions
ls -la ssl-certs/live/yourdomain.com/
```

### Domain Verification Fails
```bash
# Ensure .well-known/acme-challenge is accessible
curl http://yourdomain.com/.well-known/acme-challenge/test

# Check nginx is serving the challenge directory
docker-compose exec frontend ls -la /var/www/certbot/
```

## Security Best Practices

1. **Keep certificates secure** - Never commit to git
2. **Monitor expiry** - Set up monitoring alerts
3. **Use strong ciphers** - Already configured in nginx.conf
4. **Enable HSTS** - Already enabled in configuration
5. **Regular updates** - Keep certbot and system updated

## Certificate Renewal

### Manual Renewal
```bash
# Renew certificates
sudo certbot renew

# Copy renewed certificates
sudo cp -r /etc/letsencrypt ./ssl-certs/
sudo chown -R $USER:$USER ./ssl-certs/

# Restart frontend
docker-compose restart frontend
```

### Automated Renewal (Already Set Up)
- Cron job runs daily at 2 AM
- Automatically restarts frontend if renewal occurs
- Check cron job: `crontab -l`

Your SSL setup is now complete and production-ready! 