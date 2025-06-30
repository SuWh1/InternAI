# Domain Setup Guide for InternAI

## Complete Guide to Setting Up Your Custom Domain

### Overview
This guide will help you connect your Spaceship domain to your InternAI deployment on Azure VM. After completion, your app will be available at `https://yourdomain.com` with proper SSL certificates.

## Prerequisites
- ✅ InternAI running on Azure VM (IP: 4.231.33.64)
- ✅ Domain registered with Spaceship
- ✅ SSH access to your Azure VM

## Step 1: Configure DNS in Spaceship

### 1.1 Access Spaceship DNS Settings
1. Go to [spaceship.com](https://spaceship.com) and log in
2. Find your domain in the dashboard
3. Click on your domain name
4. Look for "DNS" or "DNS Management" section

### 1.2 Add DNS Records
Add these two A records:

```
Type: A
Name: @ (or leave blank for root domain)
Value: 4.231.33.64
TTL: 3600 (or Auto)

Type: A
Name: www  
Value: 4.231.33.64
TTL: 3600 (or Auto)
```

**Important**: DNS changes can take 1-24 hours to propagate worldwide.

## Step 2: Test DNS Propagation

You can test if DNS is working using online tools or command line:

### Online Tools:
- [whatsmydns.net](https://www.whatsmydns.net/)
- [dnschecker.org](https://dnschecker.org/)

### Command Line:
```bash
# Test your domain
nslookup yourdomain.com

# Test www subdomain  
nslookup www.yourdomain.com

# Should return: 4.231.33.64
```

## Step 3: Set Up Domain on Your VM

### 3.1 Connect to Your VM
```bash
ssh -i internai-vm_key.pem azureuser@4.231.33.64
cd ~/InternAI
```

### 3.2 Pull Latest Changes
```bash
git pull origin main
```

### 3.3 Run Domain Setup Script
```bash
bash setup-domain.sh
```

The script will:
- ✅ Ask for your domain name
- ✅ Test DNS resolution
- ✅ Update CORS settings in `.env`
- ✅ Create domain-specific nginx configuration
- ✅ Update docker-compose.yml
- ✅ Restart services

## Step 4: Set Up SSL Certificates (After DNS Propagates)

Once DNS is working (you can verify with `nslookup yourdomain.com`):

```bash
sudo bash setup-ssl.sh
```

The script will:
- ✅ Detect your domain automatically
- ✅ Ask for your email (for Let's Encrypt notifications)
- ✅ Generate SSL certificates
- ✅ Set up auto-renewal
- ✅ Configure HTTPS

## Step 5: Update Google OAuth (If Using)

If you're using Google OAuth for login, update your Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your domain to:
   - **Authorized JavaScript origins**: 
     - `https://yourdomain.com`
     - `https://www.yourdomain.com`
   - **Authorized redirect URIs**:
     - `https://yourdomain.com`
     - `https://www.yourdomain.com`

## Step 6: Verification

### 6.1 Test Your Domain
Visit your domain in a browser:
- `http://yourdomain.com` → Should redirect to HTTPS
- `https://yourdomain.com` → Should show your InternAI app
- `https://www.yourdomain.com` → Should also work

### 6.2 Test API Endpoints
```bash
# Test backend API
curl https://yourdomain.com/api/auth/status

# Should return JSON response (not 404)
```

### 6.3 SSL Certificate Check
```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Should show valid Let's Encrypt certificate
```

## Troubleshooting

### Issue: "DNS not propagated"
**Solution**: Wait longer. DNS can take up to 24 hours. You can continue with setup; SSL will work once DNS propagates.

### Issue: "502 Bad Gateway"
**Solutions**:
1. Check if backend is running: `docker-compose ps`
2. Restart services: `docker-compose restart`
3. Check logs: `docker-compose logs backend`

### Issue: "SSL certificate not found"
**Solutions**:
1. Ensure DNS is propagated: `nslookup yourdomain.com`
2. Re-run SSL setup: `sudo bash setup-ssl.sh`
3. Check certbot logs: `sudo journalctl -u certbot`

### Issue: "CORS errors"
**Solution**: Verify CORS settings in `.env`:
```bash
grep BACKEND_CORS_ORIGINS .env
# Should include your domain with both http and https
```

### Issue: "Google OAuth not working"
**Solution**: Update OAuth settings in Google Cloud Console with your new domain.

## File Structure After Setup

```
InternAI/
├── .env (updated with your domain)
├── docker-compose.yml (updated for domain)
├── frontend/
│   ├── nginx.conf (original)
│   └── nginx-domain.conf (domain-specific)
├── ssl-certs/ (SSL certificates)
├── certbot-challenges/ (Let's Encrypt challenges)
├── setup-domain.sh
└── setup-ssl.sh
```

## Maintenance

### SSL Certificate Renewal
Certificates auto-renew via cron job. You can manually renew:
```bash
sudo certbot renew
docker-compose restart frontend
```

### Updating Domain Configuration
If you need to change domains:
1. Run `bash setup-domain.sh` with new domain
2. Run `sudo bash setup-ssl.sh` for new SSL certificates

## Security Features Included

After setup, your domain will have:
- ✅ **SSL/TLS encryption** (HTTPS)
- ✅ **HTTP to HTTPS redirects**
- ✅ **HSTS headers** (force HTTPS)
- ✅ **Security headers** (XSS protection, etc.)
- ✅ **Auto-renewal** of SSL certificates

## Support

If you encounter issues:
1. Check this troubleshooting section
2. Review logs: `docker-compose logs`
3. Verify DNS propagation with online tools
4. Ensure VM firewall allows ports 80 and 443

Your InternAI application will be production-ready with your custom domain! 🚀 