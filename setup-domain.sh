#!/bin/bash

# Domain Setup Script for InternAI
# This script configures your custom domain and sets up SSL certificates

echo "🌐 InternAI - Domain Setup"
echo "=========================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "Please copy env.template to .env first:"
    echo "  cp env.template .env"
    echo ""
    exit 1
fi

echo "📝 Setting up your custom domain for InternAI"
echo ""
echo "Prerequisites:"
echo "1. You should have already configured DNS in Spaceship:"
echo "   - A record: @ -> 4.231.33.64"
echo "   - A record: www -> 4.231.33.64"
echo "2. DNS changes can take up to 24 hours to propagate"
echo ""

# Get domain from user
read -p "Enter your domain name (without www, e.g., mydomain.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ No domain provided. Exiting."
    exit 1
fi

echo ""
echo "🔍 Testing DNS resolution for $DOMAIN_NAME..."

# Test DNS resolution
if nslookup $DOMAIN_NAME | grep -q "4.231.33.64"; then
    echo "✅ DNS resolution working for $DOMAIN_NAME"
else
    echo "⚠️  DNS not fully propagated yet for $DOMAIN_NAME"
    echo "This is normal if you just configured DNS. You can continue the setup."
    echo "SSL certificates will be obtained once DNS propagates."
fi

# Test www subdomain
if nslookup www.$DOMAIN_NAME | grep -q "4.231.33.64"; then
    echo "✅ DNS resolution working for www.$DOMAIN_NAME"
else
    echo "⚠️  DNS not fully propagated yet for www.$DOMAIN_NAME"
fi

echo ""
echo "📝 Updating configuration files..."

# Update CORS origins in .env
if grep -q "BACKEND_CORS_ORIGINS=" .env; then
    # Update existing CORS setting
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|BACKEND_CORS_ORIGINS=.*|BACKEND_CORS_ORIGINS=https://$DOMAIN_NAME,https://www.$DOMAIN_NAME,http://$DOMAIN_NAME,http://www.$DOMAIN_NAME|" .env
    else
        # Linux
        sed -i "s|BACKEND_CORS_ORIGINS=.*|BACKEND_CORS_ORIGINS=https://$DOMAIN_NAME,https://www.$DOMAIN_NAME,http://$DOMAIN_NAME,http://www.$DOMAIN_NAME|" .env
    fi
    echo "✅ Updated BACKEND_CORS_ORIGINS in .env"
else
    # Add new CORS setting
    echo "BACKEND_CORS_ORIGINS=https://$DOMAIN_NAME,https://www.$DOMAIN_NAME,http://$DOMAIN_NAME,http://www.$DOMAIN_NAME" >> .env
    echo "✅ Added BACKEND_CORS_ORIGINS to .env"
fi

# Create nginx configuration for the domain
echo "📝 Creating nginx configuration for $DOMAIN_NAME..."

cat > frontend/nginx-domain.conf << EOF
upstream backend_server {
    server backend:8000;
}

# HTTP configuration - redirects to HTTPS
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # SSL certificate paths (will be created by Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Serve static files
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend_server/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }
}
EOF

echo "✅ Created nginx configuration for $DOMAIN_NAME"

# Update docker-compose to use the new nginx config
echo "📝 Updating docker-compose.yml for domain..."

# Create a backup of current docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Update the frontend service to use domain-specific nginx config
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's|frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro|frontend/nginx-domain.conf:/etc/nginx/conf.d/default.conf:ro|' docker-compose.yml
else
    # Linux  
    sed -i 's|frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro|frontend/nginx-domain.conf:/etc/nginx/conf.d/default.conf:ro|' docker-compose.yml
fi

echo "✅ Updated docker-compose.yml"

echo ""
echo "🔄 Restarting services..."
docker-compose restart backend frontend

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Wait for DNS propagation (can take up to 24 hours)"
echo "   Test with: nslookup $DOMAIN_NAME"
echo ""
echo "2. Once DNS is working, set up SSL certificates:"
echo "   sudo bash setup-ssl.sh"
echo ""
echo "3. Your app will be available at:"
echo "   - http://$DOMAIN_NAME (will redirect to HTTPS after SSL setup)"
echo "   - https://$DOMAIN_NAME (after SSL setup)"
echo ""
echo "4. Update any external integrations (Google OAuth, etc.) to use your domain"
echo ""
echo "⚠️  Current status:"
echo "   - ✅ Domain configuration: Complete"
echo "   - ⏳ DNS propagation: In progress"
echo "   - ⏳ SSL certificates: Pending (run setup-ssl.sh after DNS)"
echo ""
echo "🎉 Domain setup complete! Run 'bash setup-ssl.sh' once DNS propagates." 