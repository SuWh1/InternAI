#!/bin/bash

# Deployment Validation Script for InternAI
# This script validates that your SSL deployment is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if domain is provided
if [ -z "$1" ]; then
    print_fail "Usage: $0 <your-domain.com>"
    exit 1
fi

DOMAIN=$1

print_info "Validating deployment for: $DOMAIN"
echo

# Test 1: HTTP to HTTPS Redirect
print_info "Testing HTTP to HTTPS redirect..."
HTTP_RESPONSE=$(curl -s -I -L http://$DOMAIN | head -1)
if [[ $HTTP_RESPONSE == *"301"* ]] || [[ $HTTP_RESPONSE == *"308"* ]]; then
    print_pass "HTTP redirects to HTTPS"
else
    print_fail "HTTP redirect not working: $HTTP_RESPONSE"
fi

# Test 2: HTTPS Access
print_info "Testing HTTPS access..."
HTTPS_RESPONSE=$(curl -s -I https://$DOMAIN | head -1)
if [[ $HTTPS_RESPONSE == *"200"* ]]; then
    print_pass "HTTPS is accessible"
else
    print_fail "HTTPS not working: $HTTPS_RESPONSE"
fi

# Test 3: SSL Certificate
print_info "Checking SSL certificate..."
SSL_INFO=$(curl -s -I https://$DOMAIN 2>&1)
if [[ $SSL_INFO != *"SSL certificate problem"* ]]; then
    print_pass "SSL certificate is valid"
else
    print_fail "SSL certificate issue"
fi

# Test 4: API Proxy
print_info "Testing API proxy..."
API_RESPONSE=$(curl -s -I https://$DOMAIN/api/ | head -1)
if [[ $API_RESPONSE == *"200"* ]] || [[ $API_RESPONSE == *"404"* ]]; then
    print_pass "API proxy is working"
else
    print_fail "API proxy not working: $API_RESPONSE"
fi

# Test 5: Security Headers
print_info "Checking security headers..."
HEADERS=$(curl -s -I https://$DOMAIN)

if [[ $HEADERS == *"Strict-Transport-Security"* ]]; then
    print_pass "HSTS header present"
else
    print_fail "HSTS header missing"
fi

if [[ $HEADERS == *"X-Frame-Options"* ]]; then
    print_pass "X-Frame-Options header present"
else
    print_fail "X-Frame-Options header missing"
fi

# Test 6: Docker Services
print_info "Checking Docker services..."
if docker-compose ps | grep -q "Up"; then
    print_pass "Docker services are running"
else
    print_fail "Some Docker services are not running"
fi

# Test 7: Certificate Expiry
print_info "Checking certificate expiry..."
if command -v openssl &> /dev/null; then
    CERT_EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter)
    print_info "Certificate expires: ${CERT_EXPIRY#*=}"
else
    print_info "OpenSSL not available, cannot check certificate expiry"
fi

echo
print_info "Validation complete for $DOMAIN"
print_info "If all tests passed, your deployment is ready!"
print_info "If any tests failed, check the troubleshooting section in DEPLOYMENT.md" 