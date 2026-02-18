#!/bin/bash

# ==============================================================================
# Pharmaceutical Stockist - Integrated Build & Deploy Script
# ==============================================================================
# This script orchestrates the build process for both backend and frontend,
# runs optional tests, and deploys the entire stack using Docker Compose.
# ==============================================================================

set -e # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check dependencies
check_deps() {
    log_info "Checking dependencies..."
    command -v docker >/dev/null 2>&1 || { log_error "Docker is not installed."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is not installed."; exit 1; }
    log_success "All dependencies found."
}

# Run tests if requested
run_tests() {
    if [[ "$1" == "--test" ]]; then
        log_info "Running application tests..."
        
        log_info "Testing Backend (Maven)..."
        cd backend && ./mvnw clean test && cd ..
        
        log_info "Testing Frontend (Lint)..."
        cd frontend && npm install && npm run lint && cd ..
        
        log_success "Tests passed."
    else
        log_info "Skipping local tests (use --test to enable)."
    fi
}

# Build and Deploy
deploy() {
    log_info "Starting Orchestrated Deployment..."
    
    # 1. Bring down existing containers to ensure a clean start if needed
    # log_info "Stopping existing services..."
    # docker-compose down
    
    # 2. Rebuild and Start services
    log_info "Building and starting services with Docker Compose..."
    docker-compose up -d --build
    
    log_success "Services are starting up."
}

# Verify health
verify() {
    log_info "Verifying service health..."
    sleep 5
    
    # Check container status
    docker-compose ps
    
    echo ""
    log_info "Access Points:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8080"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001 (Default: admin/admin)"
    echo "  - Alertmanager: http://localhost:9093"
}

# Master Flow
main() {
    log_info "PHARMA-STOCKIST: INTEGRATED DEPLOYMENT"
    echo "------------------------------------------------"
    check_deps
    run_tests "$1"
    deploy
    verify
    echo "------------------------------------------------"
    log_success "Deployment Complete!"
}

main "$@"
