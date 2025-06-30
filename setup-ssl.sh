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

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <your-domain.com> [email@example.com]"
    print_error "Example: $0 myapp.azurewebsites.net admin@mycompany.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}

print_status "Setting up SSL certificates for domain: $DOMAIN"
print_status "Email for Let's Encrypt: $EMAIL"

# Create necessary directories
print_status "Creating SSL directories..."
mkdir -p ssl-certs
mkdir -p certbot-challenges

# Update nginx configuration with actual domain
print_status "Updating nginx configuration..."
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" frontend/nginx.conf
sed -i "s/server_name _;/server_name $DOMAIN;/g" frontend/nginx.conf

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