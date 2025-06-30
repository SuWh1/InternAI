#!/bin/bash

# SSL Setup Script for InternAI on Azure VM
# This script sets up Let's Encrypt SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Try to detect domain from nginx configuration
DOMAIN=""
if [ -f "frontend/nginx-domain.conf" ]; then
    DOMAIN=$(grep "server_name" frontend/nginx-domain.conf | head -1 | awk '{print $2}' | sed 's/;//')
    if [ "$DOMAIN" != "" ] && [ "$DOMAIN" != "_" ]; then
        print_status "Detected domain from configuration: $DOMAIN"
    else
        DOMAIN=""
    fi
fi

# If no domain detected or provided, ask user
if [ -z "$1" ] && [ -z "$DOMAIN" ]; then
    echo ""
    echo "🔐 SSL Certificate Setup"
    echo "======================="
    echo ""
    read -p "Enter your domain name (e.g., mydomain.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        print_error "No domain provided. Exiting."
        exit 1
    fi
elif [ ! -z "$1" ]; then
    DOMAIN=$1
fi

# Get email for Let's Encrypt
if [ -z "$2" ]; then
    read -p "Enter your email for Let's Encrypt notifications (or press Enter for admin@$DOMAIN): " INPUT_EMAIL
    EMAIL=${INPUT_EMAIL:-"admin@$DOMAIN"}
else
    EMAIL=$2
fi

print_status "Setting up SSL certificates for domain: $DOMAIN"
print_status "Email for Let's Encrypt: $EMAIL"

# Create necessary directories
print_status "Creating SSL directories..."
mkdir -p ssl-certs
mkdir -p certbot-challenges

# Check if domain-specific nginx config exists
if [ -f "frontend/nginx-domain.conf" ]; then
    print_status "Using existing domain-specific nginx configuration..."
else
    print_status "Creating nginx configuration for $DOMAIN..."
    # If no domain config exists, create one (fallback)
    if [ -f "frontend/nginx.conf" ]; then
        cp frontend/nginx.conf frontend/nginx-domain.conf
        sed -i "s/YOUR_DOMAIN/$DOMAIN/g" frontend/nginx-domain.conf
        sed -i "s/server_name _;/server_name $DOMAIN www.$DOMAIN;/g" frontend/nginx-domain.conf
    else
        print_error "No nginx configuration found. Please run setup-domain.sh first."
        exit 1
    fi
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    print_status "Installing certbot..."
    
    # For Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot
    # For CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot
    else
        print_error "Could not install certbot. Please install it manually."
        exit 1
    fi
else
    print_status "Certbot already installed"
fi

# Start the application temporarily for certificate generation
print_status "Starting application temporarily for certificate generation..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Generate SSL certificate
print_status "Generating SSL certificate..."
sudo certbot certonly \
    --webroot \
    --webroot-path=./certbot-challenges \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN

# Copy certificates to our directory
print_status "Copying certificates..."
sudo cp -r /etc/letsencrypt ./ssl-certs/
sudo chown -R $(whoami):$(whoami) ./ssl-certs/

# Restart services with SSL
print_status "Restarting services with SSL..."
docker-compose down
docker-compose up -d

# Set up auto-renewal
print_status "Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 2 * * * certbot renew --quiet && docker-compose restart frontend") | crontab -

print_status "SSL setup completed successfully!"
print_status "Your application is now available at: https://$DOMAIN"
print_warning "Don't forget to:"
print_warning "1. Update your DNS A record to point to this server's IP"
print_warning "2. Update BACKEND_CORS_ORIGINS to include https://$DOMAIN"
print_warning "3. Update VITE_API_BASE_URL to https://$DOMAIN/api" 