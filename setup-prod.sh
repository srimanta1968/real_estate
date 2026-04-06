#!/bin/bash
# ─── DealEval Production Setup Script ───────────────────────────
# Run this on the EC2 instance to set up everything:
#   - Nginx reverse proxy
#   - SSL via Let's Encrypt (auto-renewal)
#   - PostgreSQL database
#   - Node.js application
#
# Usage: bash setup-prod.sh
# ────────────────────────────────────────────────────────────────

set -e

DOMAIN="dealeval.projexlight.com"
APP_DIR="/home/ec2-user/dealeval"
SERVER_PORT=3000
CLIENT_PORT=5173
EMAIL="support@projexlight.com"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  DealEval Production Setup${NC}"
echo -e "${BLUE}  Domain: ${DOMAIN}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# ── Step 1: System packages ─────────────────────────────────────
echo -e "${BLUE}[1/8] Installing system packages...${NC}"
sudo yum update -y
sudo yum install -y nginx git postgresql15 jq

# Install certbot for SSL
sudo yum install -y python3-pip
sudo pip3 install certbot certbot-nginx 2>/dev/null || {
  # Amazon Linux 2023 / AL2 fallback
  sudo yum install -y certbot python3-certbot-nginx 2>/dev/null || {
    sudo amazon-linux-extras install epel -y 2>/dev/null
    sudo yum install -y certbot python3-certbot-nginx
  }
}
echo -e "${GREEN}  System packages installed${NC}"

# ── Step 2: Node.js ─────────────────────────────────────────────
echo -e "\n${BLUE}[2/8] Setting up Node.js...${NC}"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
  sudo yum install -y nodejs
fi
echo -e "  Node: $(node --version)"
echo -e "  npm:  $(npm --version)"
echo -e "${GREEN}  Node.js ready${NC}"

# ── Step 3: Clone/Pull repository ───────────────────────────────
echo -e "\n${BLUE}[3/8] Setting up application code...${NC}"
if [ -d "$APP_DIR" ]; then
  echo "  Repository exists, pulling latest..."
  cd "$APP_DIR" && git pull
else
  echo "  Cloning repository..."
  echo -e "${YELLOW}  NOTE: You need to clone your repo manually first:${NC}"
  echo -e "${YELLOW}    git clone <your-repo-url> $APP_DIR${NC}"
  echo -e "${YELLOW}  Then re-run this script.${NC}"
  if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}  ERROR: $APP_DIR does not exist. Clone your repo first.${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}  Application code ready${NC}"

# ── Step 4: Install dependencies + build ────────────────────────
echo -e "\n${BLUE}[4/8] Installing dependencies and building...${NC}"
cd "$APP_DIR/server" && npm install
cd "$APP_DIR/client" && npm install && npm run build
echo -e "${GREEN}  Dependencies installed and client built${NC}"

# ── Step 5: PostgreSQL setup ────────────────────────────────────
echo -e "\n${BLUE}[5/8] Setting up PostgreSQL...${NC}"

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql 2>/dev/null; then
  echo "  Starting PostgreSQL..."
  sudo systemctl start postgresql 2>/dev/null || echo -e "  ${YELLOW}PostgreSQL not installed as service. Using existing instance.${NC}"
  sudo systemctl enable postgresql 2>/dev/null || true
fi

# Read DB config from server/.env
if [ -f "$APP_DIR/server/.env" ]; then
  DB_NAME=$(grep "^DB_NAME=" "$APP_DIR/server/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d $'\r')
  DB_USER=$(grep "^DB_USER=" "$APP_DIR/server/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d $'\r')
  DB_PASSWORD=$(grep "^DB_PASSWORD=" "$APP_DIR/server/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d $'\r')
  DB_PORT=$(grep "^DB_PORT=" "$APP_DIR/server/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d $'\r')
fi

DB_NAME="${DB_NAME:-real_estate_deal_evaluator_db}"
DB_USER="${DB_USER:-dealeval}"
DB_PORT="${DB_PORT:-5432}"

# Create user and database
echo "  Creating database user and database..."
sudo -u postgres psql -p "$DB_PORT" -c "
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
    END IF;
  END
  \$\$;
" 2>/dev/null || echo -e "  ${YELLOW}User creation skipped (may already exist)${NC}"

sudo -u postgres psql -p "$DB_PORT" -c "
  SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')
  \gexec
" 2>/dev/null || echo -e "  ${YELLOW}Database creation skipped (may already exist)${NC}"

# Run migration scripts
echo "  Running migrations..."
for sql_file in "$APP_DIR/init-scripts"/*.sql; do
  [ -f "$sql_file" ] || continue
  echo "    Applying: $(basename "$sql_file")"
  sudo -u postgres psql -p "$DB_PORT" -d "$DB_NAME" -f "$sql_file" >/dev/null 2>&1 || true
done

# Grant permissions
echo "  Granting permissions..."
sudo -u postgres psql -p "$DB_PORT" -d "$DB_NAME" -c "
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
" >/dev/null 2>&1

echo -e "${GREEN}  PostgreSQL ready${NC}"

# ── Step 6: Nginx configuration ────────────────────────────────
echo -e "\n${BLUE}[6/8] Configuring Nginx...${NC}"

# Create nginx config
sudo tee /etc/nginx/conf.d/dealeval.conf > /dev/null << NGINXEOF
# DealEval - ${DOMAIN}
# Reverse proxy for Node.js server + Vite client

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

server {
    listen 80;
    server_name ${DOMAIN};

    # Redirect HTTP to HTTPS (will be updated by certbot)
    location / {
        return 301 https://\$host\$request_uri;
    }

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL certificates (will be updated by certbot)
    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Max upload size
    client_max_body_size 10M;

    # API routes → Express server (port ${SERVER_PORT})
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://127.0.0.1:${SERVER_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 120s;
    }

    # Stripe webhook — needs raw body, no rate limit
    location /api/webhooks/stripe {
        proxy_pass http://127.0.0.1:${SERVER_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Auth rate limiting (stricter)
    location /api/auth/ {
        limit_req zone=login burst=10 nodelay;
        proxy_pass http://127.0.0.1:${SERVER_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:${SERVER_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Frontend — Vite dev server or built static files
    location / {
        # Option A: Proxy to Vite dev server (development)
        # proxy_pass http://127.0.0.1:${CLIENT_PORT};

        # Option B: Serve built static files (production - recommended)
        root ${APP_DIR}/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
NGINXEOF

# Create self-signed cert as placeholder (certbot will replace it)
sudo mkdir -p /etc/nginx/ssl
if [ ! -f /etc/nginx/ssl/selfsigned.crt ]; then
  echo "  Creating temporary self-signed certificate..."
  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/selfsigned.key \
    -out /etc/nginx/ssl/selfsigned.crt \
    -subj "/CN=${DOMAIN}" 2>/dev/null
fi

# Test nginx config
sudo nginx -t
echo -e "${GREEN}  Nginx configured${NC}"

# ── Step 7: SSL with Let's Encrypt ──────────────────────────────
echo -e "\n${BLUE}[7/8] Setting up SSL certificate...${NC}"

# Start nginx first (needed for HTTP challenge)
sudo systemctl start nginx 2>/dev/null || sudo nginx
sudo systemctl enable nginx 2>/dev/null || true

echo -e "  ${YELLOW}Requesting SSL certificate for ${DOMAIN}...${NC}"
echo -e "  ${YELLOW}NOTE: DNS must point ${DOMAIN} to this server's IP first!${NC}"

# Check if DNS resolves to this server
SERVER_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")
DNS_IP=$(dig +short "${DOMAIN}" 2>/dev/null || echo "")

echo -e "  Server IP: ${SERVER_IP}"
echo -e "  DNS IP:    ${DNS_IP:-not resolved}"

if [ "$SERVER_IP" = "$DNS_IP" ]; then
  echo -e "  ${GREEN}DNS matches! Requesting certificate...${NC}"
  sudo certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email "${EMAIL}" --redirect || {
    echo -e "  ${YELLOW}Certbot failed. You can run it manually later:${NC}"
    echo -e "  ${YELLOW}  sudo certbot --nginx -d ${DOMAIN}${NC}"
  }
else
  echo -e "  ${YELLOW}DNS does not match server IP. SSL setup skipped.${NC}"
  echo -e "  ${YELLOW}Steps to fix:${NC}"
  echo -e "  ${YELLOW}  1. Add DNS A record: ${DOMAIN} → ${SERVER_IP}${NC}"
  echo -e "  ${YELLOW}  2. Wait for DNS propagation (5-30 minutes)${NC}"
  echo -e "  ${YELLOW}  3. Run: sudo certbot --nginx -d ${DOMAIN}${NC}"
fi

# Setup auto-renewal cron
echo "  Setting up auto-renewal..."
(sudo crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -
echo -e "${GREEN}  SSL auto-renewal configured (daily at 3 AM)${NC}"

# ── Step 8: Start application ───────────────────────────────────
echo -e "\n${BLUE}[8/8] Starting DealEval...${NC}"

# Make management script executable
chmod +x "$APP_DIR/dealeval-server.sh"

# Start the server (backend only - nginx serves static frontend)
cd "$APP_DIR"
./dealeval-server.sh start

# Reload nginx to pick up any certbot changes
sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DealEval Production Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Domain:     https://${DOMAIN}"
echo -e "  API:        https://${DOMAIN}/api"
echo -e "  Health:     https://${DOMAIN}/health"
echo -e "  Server IP:  ${SERVER_IP}"
echo ""
echo -e "  ${BLUE}Management commands:${NC}"
echo -e "    ./dealeval-server.sh status   - Check status"
echo -e "    ./dealeval-server.sh logs     - View logs"
echo -e "    ./dealeval-server.sh deploy   - Deploy updates"
echo -e "    ./dealeval-server.sh restart  - Restart services"
echo ""
echo -e "  ${YELLOW}Remaining manual steps:${NC}"
echo -e "    1. Ensure DNS A record points ${DOMAIN} → ${SERVER_IP}"
echo -e "    2. Update server/.env with production values:"
echo -e "       - JWT_SECRET (generate: openssl rand -hex 32)"
echo -e "       - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET"
echo -e "       - GOOGLE_OAUTH_* and LINKEDIN_* credentials"
echo -e "       - DB_PASSWORD"
echo -e "    3. Update client/.env:"
echo -e "       - VITE_API_URL=https://${DOMAIN}/api"
echo -e "       - VITE_EXTENSION_ID=<your-chrome-extension-id>"
echo -e "    4. If SSL failed, run: sudo certbot --nginx -d ${DOMAIN}"
echo -e "    5. Rebuild client after .env changes: cd client && npm run build"
echo ""
