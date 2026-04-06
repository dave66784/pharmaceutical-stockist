#!/bin/bash

# ==============================================================================
# Pharmaceutical Stockist - SIT Build & Deploy Script
# ==============================================================================
# Runs the stack with the 'sit' Spring profile — real OTP emails required,
# email notifications enabled. Requires MAIL_PASSWORD in the environment or .env
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.sit.yml"

check_deps() {
    log_info "Checking dependencies..."
    command -v docker >/dev/null 2>&1 || { log_error "Docker is not installed."; exit 1; }
    log_success "All dependencies found."
}

check_env() {
    log_info "Checking required environment variables..."

    # Load .env if MAIL_PASSWORD isn't already in the shell environment
    if [[ -z "${MAIL_PASSWORD}" && -f ".env" ]]; then
        export $(grep -v '^#' .env | grep 'MAIL_PASSWORD' | xargs)
    fi

    if [[ -z "${MAIL_PASSWORD}" ]]; then
        log_error "MAIL_PASSWORD is not set. SIT profile requires real email delivery."
        log_error "Add MAIL_PASSWORD=... to your .env file or export it, then re-run."
        exit 1
    fi
    log_success "Environment looks good."
}

run_tests() {
    if [[ "$1" == "--test" ]]; then
        log_info "Running backend tests..."
        cd backend && ./mvnw clean test && cd ..

        log_info "Running frontend lint..."
        cd frontend && npm install && npm run lint && cd ..

        log_success "Tests passed."
    else
        log_info "Skipping tests (use --test to enable)."
    fi
}

deploy() {
    log_info "Building and starting services with SIT profile..."
    $COMPOSE_CMD up -d --build
    log_success "Services are starting up."
}

verify() {
    log_info "Verifying service health..."
    sleep 5
    $COMPOSE_CMD ps

    echo ""
    log_info "Active profile: sit (real OTPs required)"
    log_info "Access Points:"
    echo "  - Frontend:      http://localhost:3000"
    echo "  - Prometheus:    http://localhost:9090"
    echo "  - Grafana:       http://localhost:3001"
    echo "  - Alertmanager:  http://localhost:9093"
}

main() {
    log_info "PHARMA-STOCKIST: SIT DEPLOYMENT"
    echo "------------------------------------------------"
    check_deps
    check_env
    run_tests "$1"
    deploy
    verify
    echo "------------------------------------------------"
    log_success "SIT Deployment Complete!"
}

main "$@"
