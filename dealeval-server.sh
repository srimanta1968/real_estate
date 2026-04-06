#!/bin/bash
# ─── DealEval Server Management Script ──────────────────────────
# Usage:
#   ./dealeval-server.sh start    - Start both client + server
#   ./dealeval-server.sh stop     - Stop both
#   ./dealeval-server.sh restart  - Stop then start
#   ./dealeval-server.sh status   - Show running processes
#   ./dealeval-server.sh deploy   - git pull + build + restart (one-step deploy)
#   ./dealeval-server.sh setup    - First-time setup (install deps, DB, build)
#   ./dealeval-server.sh logs     - Tail server logs (use "logs client" for client)
#   ./dealeval-server.sh db-setup - Run database migrations only
#   ./dealeval-server.sh db-grant - Grant DB permissions to app user

# Load shell profile so node/npm PATH and env vars are available
[ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc"
[ -f "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"

# ── Configuration ────────────────────────────────────────────────
PROJECT_DIR="/home/ec2-user/dealeval"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
SERVER_LOG="$PROJECT_DIR/dealeval-server.log"
CLIENT_LOG="$PROJECT_DIR/dealeval-client.log"
SERVER_PID="$PROJECT_DIR/dealeval-server.pid"
CLIENT_PID="$PROJECT_DIR/dealeval-client.pid"

# Ports
SERVER_PORT=3000
CLIENT_PORT=5173

# Database (read from server/.env if available)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="real_estate_deal_evaluator_db"
DB_USER="dealeval"
DB_PASSWORD=""
DB_SUPERUSER="postgres"

# Load DB config from server/.env
if [ -f "$SERVER_DIR/.env" ]; then
  DB_HOST=$(grep "^DB_HOST=" "$SERVER_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d $'\r')
  DB_PORT=$(grep "^DB_PORT=" "$SERVER_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d $'\r')
  DB_NAME=$(grep "^DB_NAME=" "$SERVER_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d $'\r')
  DB_USER=$(grep "^DB_USER=" "$SERVER_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d $'\r')
  DB_PASSWORD=$(grep "^DB_PASSWORD=" "$SERVER_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d $'\r')
fi

# ── Colors ───────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ── First-Time Setup ────────────────────────────────────────────
setup_server() {
  echo -e "${BLUE}═══════════════════════════════════════════${NC}"
  echo -e "${BLUE}  DealEval First-Time Setup${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════${NC}"
  echo ""

  cd "$PROJECT_DIR" || { echo -e "${RED}ERROR: Project directory not found: $PROJECT_DIR${NC}"; exit 1; }

  # Step 1: Check prerequisites
  echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"
  command -v node >/dev/null 2>&1 || { echo -e "${RED}ERROR: Node.js not installed. Install via: curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs${NC}"; exit 1; }
  command -v npm >/dev/null 2>&1 || { echo -e "${RED}ERROR: npm not installed${NC}"; exit 1; }
  command -v psql >/dev/null 2>&1 || echo -e "${YELLOW}WARNING: psql not found. Install: sudo yum install -y postgresql15${NC}"
  echo -e "  Node: $(node --version)"
  echo -e "  npm:  $(npm --version)"
  echo -e "  ${GREEN}Prerequisites OK${NC}"

  # Step 2: Install server dependencies
  echo -e "\n${BLUE}[2/7] Installing server dependencies...${NC}"
  cd "$SERVER_DIR" && npm install
  echo -e "  ${GREEN}Server dependencies installed${NC}"

  # Step 3: Install client dependencies
  echo -e "\n${BLUE}[3/7] Installing client dependencies...${NC}"
  cd "$CLIENT_DIR" && npm install
  echo -e "  ${GREEN}Client dependencies installed${NC}"

  # Step 4: Setup database
  echo -e "\n${BLUE}[4/7] Setting up database...${NC}"
  setup_database

  # Step 5: Run migrations
  echo -e "\n${BLUE}[5/7] Running database migrations...${NC}"
  run_migrations

  # Step 6: Grant permissions
  echo -e "\n${BLUE}[6/7] Granting database permissions...${NC}"
  grant_db_permissions

  # Step 7: Build client for production
  echo -e "\n${BLUE}[7/7] Building client...${NC}"
  cd "$CLIENT_DIR" && npm run build
  echo -e "  ${GREEN}Client built${NC}"

  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════${NC}"
  echo -e "${GREEN}  Setup Complete!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════${NC}"
  echo ""
  echo -e "  Start DealEval:  ${BLUE}./dealeval-server.sh start${NC}"
  echo -e "  Server URL:      http://localhost:${SERVER_PORT}"
  echo -e "  Client URL:      http://localhost:${CLIENT_PORT}"
  echo ""
  echo -e "  ${YELLOW}Don't forget to:${NC}"
  echo -e "  1. Update server/.env with your Stripe keys"
  echo -e "  2. Update server/.env with production JWT_SECRET"
  echo -e "  3. Update server/.env with your OAuth credentials"
  echo -e "  4. Set VITE_EXTENSION_ID in client/.env"
  echo ""
}

# ── Database Setup ──────────────────────────────────────────────
setup_database() {
  if ! command -v psql >/dev/null 2>&1; then
    echo -e "  ${YELLOW}psql not available, skipping DB setup. Run migrations manually.${NC}"
    return
  fi

  # Check if database exists
  if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "  ${GREEN}Database '$DB_NAME' exists and is accessible${NC}"
    return
  fi

  echo -e "  Creating database and user..."

  # Create user (if not exists)
  sudo -u postgres psql -p "$DB_PORT" -c "
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
        CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
      END IF;
    END
    \$\$;
  " 2>/dev/null || echo -e "  ${YELLOW}Could not create user via sudo. Create manually if needed.${NC}"

  # Create database (if not exists)
  sudo -u postgres psql -p "$DB_PORT" -c "
    SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')
    \gexec
  " 2>/dev/null || echo -e "  ${YELLOW}Could not create database via sudo. Create manually if needed.${NC}"

  echo -e "  ${GREEN}Database setup complete${NC}"
}

# ── Run Migrations ──────────────────────────────────────────────
run_migrations() {
  if ! command -v psql >/dev/null 2>&1; then
    echo -e "  ${YELLOW}psql not available. Migrations will run on server startup via auto-migrate.${NC}"
    return
  fi

  echo -e "  Running SQL migration scripts..."

  local scripts_dir="$PROJECT_DIR/init-scripts"
  if [ ! -d "$scripts_dir" ]; then
    echo -e "  ${YELLOW}No init-scripts directory found${NC}"
    return
  fi

  for sql_file in "$scripts_dir"/*.sql; do
    [ -f "$sql_file" ] || continue
    local filename=$(basename "$sql_file")
    echo -e "  Applying: ${filename}..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "$DB_NAME" -f "$sql_file" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo -e "    ${GREEN}OK${NC}"
    else
      echo -e "    ${YELLOW}Applied with warnings (may already exist)${NC}"
    fi
  done

  echo -e "  ${GREEN}Migrations complete${NC}"
}

# ── Grant DB Permissions ────────────────────────────────────────
grant_db_permissions() {
  if ! command -v psql >/dev/null 2>&1; then
    echo -e "  ${YELLOW}psql not available, skipping permission grant${NC}"
    return
  fi

  echo -e "  Granting permissions to '${DB_USER}'..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "$DB_NAME" -c "
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
  " >/dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}Permissions granted${NC}"
  else
    echo -e "  ${YELLOW}Could not grant permissions. Run: ./dealeval-server.sh db-grant${NC}"
  fi
}

# ── Deploy (git pull + rebuild + restart) ────────────────────────
deploy_server() {
  echo -e "${BLUE}═══════════════════════════════════════════${NC}"
  echo -e "${BLUE}  DealEval Deploy${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════${NC}"

  cd "$PROJECT_DIR" || exit 1

  echo -e "\n${BLUE}[1/5] Pulling latest code...${NC}"
  git pull || { echo -e "${RED}ERROR: git pull failed${NC}"; return 1; }

  echo -e "\n${BLUE}[2/5] Installing dependencies...${NC}"
  cd "$SERVER_DIR" && npm install --production=false 2>/dev/null
  cd "$CLIENT_DIR" && npm install 2>/dev/null

  # Clear Vite cache to prevent stale chunk errors
  echo -e "\n${BLUE}[3/5] Building client...${NC}"
  rm -rf "$CLIENT_DIR/node_modules/.vite"
  cd "$CLIENT_DIR" && npm run build

  echo -e "\n${BLUE}[4/5] Running database migrations...${NC}"
  run_migrations
  grant_db_permissions

  echo -e "\n${BLUE}[5/5] Restarting services...${NC}"
  cd "$PROJECT_DIR" || exit 1
  stop_server
  sleep 2
  start_server

  echo ""
  echo -e "${GREEN}Deploy complete.${NC}"
}

# ── Start Server ─────────────────────────────────────────────────
start_server() {
  # ── Backend (port 3000) ──
  if [ -f "$SERVER_PID" ] && kill -0 "$(cat "$SERVER_PID")" 2>/dev/null; then
    echo -e "  Server already running (PID $(cat "$SERVER_PID"))"
  else
    echo -e "  Starting DealEval server..."
    cd "$SERVER_DIR" || exit 1
    nohup npm run dev > "$SERVER_LOG" 2>&1 &
    echo $! > "$SERVER_PID"

    echo -e "  Waiting for port ${SERVER_PORT}..."
    local count=0
    while ! ss -tlnp 2>/dev/null | grep -q ":${SERVER_PORT}" && [ $count -lt 20 ]; do
      sleep 1
      count=$((count + 1))
    done

    if ss -tlnp 2>/dev/null | grep -q ":${SERVER_PORT}"; then
      echo -e "  ${GREEN}Server started (PID $(cat "$SERVER_PID")) — port ${SERVER_PORT}${NC}"
    else
      echo -e "  ${RED}ERROR: Server failed to start. Check: tail $SERVER_LOG${NC}"
      return 1
    fi
  fi

  # ── Frontend (port 5173) ──
  if [ -f "$CLIENT_PID" ] && kill -0 "$(cat "$CLIENT_PID")" 2>/dev/null; then
    echo -e "  Client already running (PID $(cat "$CLIENT_PID"))"
  else
    echo -e "  Starting DealEval client..."
    cd "$CLIENT_DIR" || exit 1
    nohup npm run dev > "$CLIENT_LOG" 2>&1 &
    echo $! > "$CLIENT_PID"

    echo -e "  Waiting for port ${CLIENT_PORT}..."
    local count=0
    while ! ss -tlnp 2>/dev/null | grep -q ":${CLIENT_PORT}" && [ $count -lt 15 ]; do
      sleep 1
      count=$((count + 1))
    done

    if ss -tlnp 2>/dev/null | grep -q ":${CLIENT_PORT}"; then
      echo -e "  ${GREEN}Client started (PID $(cat "$CLIENT_PID")) — port ${CLIENT_PORT}${NC}"
    else
      echo -e "  ${RED}ERROR: Client failed to start. Check: tail $CLIENT_LOG${NC}"
      return 1
    fi
  fi

  echo ""
  echo -e "${GREEN}DealEval is running:${NC}"
  echo -e "  Server:  http://localhost:${SERVER_PORT}"
  echo -e "  Client:  http://localhost:${CLIENT_PORT}"
  echo -e "  Health:  http://localhost:${SERVER_PORT}/health"
}

# ── Stop Server ──────────────────────────────────────────────────
stop_server() {
  echo "Stopping DealEval..."

  # Kill all dealeval processes
  local pids
  pids=$(pgrep -f "dealeval/" 2>/dev/null | grep -v "$$")
  if [ -n "$pids" ]; then
    echo "  Sending SIGTERM..."
    echo "$pids" | xargs kill -TERM 2>/dev/null

    local count=0
    while pgrep -f "dealeval/" >/dev/null 2>&1 && [ $count -lt 10 ]; do
      sleep 1
      count=$((count + 1))
    done

    # Force kill remaining
    pids=$(pgrep -f "dealeval/" 2>/dev/null | grep -v "$$")
    if [ -n "$pids" ]; then
      echo "  Force killing remaining..."
      echo "$pids" | xargs kill -9 2>/dev/null
    fi
  else
    echo "  No DealEval processes found."
  fi

  rm -f "$SERVER_PID" "$CLIENT_PID"
  echo -e "  ${GREEN}DealEval stopped.${NC}"
}

# ── Status ───────────────────────────────────────────────────────
show_status() {
  echo -e "${BLUE}═══ DealEval Status ═══${NC}"
  echo ""

  # Server
  if [ -f "$SERVER_PID" ] && kill -0 "$(cat "$SERVER_PID")" 2>/dev/null; then
    echo -e "  Server:  ${GREEN}RUNNING${NC} (PID $(cat "$SERVER_PID"))"
  else
    echo -e "  Server:  ${RED}STOPPED${NC}"
  fi

  # Client
  if [ -f "$CLIENT_PID" ] && kill -0 "$(cat "$CLIENT_PID")" 2>/dev/null; then
    echo -e "  Client:  ${GREEN}RUNNING${NC} (PID $(cat "$CLIENT_PID"))"
  else
    echo -e "  Client:  ${RED}STOPPED${NC}"
  fi

  # Health check
  local health
  health=$(curl -s --max-time 3 "http://localhost:${SERVER_PORT}/health" 2>/dev/null)
  if echo "$health" | grep -q '"ok"'; then
    echo -e "  Health:  ${GREEN}OK${NC}"
  else
    echo -e "  Health:  ${RED}UNREACHABLE${NC}"
  fi

  # Database
  if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    local user_count
    user_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    echo -e "  Database: ${GREEN}CONNECTED${NC} (${user_count:-0} users)"
  else
    echo -e "  Database: ${RED}DISCONNECTED${NC}"
  fi

  echo ""
  echo -e "${BLUE}--- Ports ---${NC}"
  ss -tlnp 2>/dev/null | grep -E ":(${SERVER_PORT}|${CLIENT_PORT}|${DB_PORT})" || echo "  (none listening)"

  echo ""
  echo -e "${BLUE}--- Processes ---${NC}"
  ps -eo pid,ppid,etime,rss,args 2>/dev/null | grep "dealeval" | grep -v grep || echo "  (none)"
}

# ── Logs ─────────────────────────────────────────────────────────
show_logs() {
  local target="${1:-server}"
  if [ "$target" = "client" ]; then
    [ -f "$CLIENT_LOG" ] && tail -f "$CLIENT_LOG" || echo "No client log found at $CLIENT_LOG"
  else
    [ -f "$SERVER_LOG" ] && tail -f "$SERVER_LOG" || echo "No server log found at $SERVER_LOG"
  fi
}

# ── Main ─────────────────────────────────────────────────────────
case "$1" in
  start)     start_server ;;
  stop)      stop_server ;;
  restart)   stop_server; echo ""; sleep 2; start_server ;;
  deploy)    deploy_server ;;
  setup)     setup_server ;;
  status)    show_status ;;
  logs)      show_logs "$2" ;;
  db-setup)  run_migrations ;;
  db-grant)  grant_db_permissions ;;
  *)
    echo -e "${BLUE}DealEval Server Management${NC}"
    echo ""
    echo "Usage: $0 {command}"
    echo ""
    echo "Commands:"
    echo "  setup     - First-time setup (install deps, DB, build)"
    echo "  start     - Start server + client"
    echo "  stop      - Stop all services"
    echo "  restart   - Stop then start"
    echo "  deploy    - git pull + build + restart (one-step deploy)"
    echo "  status    - Show running processes and health"
    echo "  logs      - Tail server logs (use 'logs client' for client)"
    echo "  db-setup  - Run database migrations only"
    echo "  db-grant  - Grant DB permissions to app user"
    echo ""
    exit 1
    ;;
esac
