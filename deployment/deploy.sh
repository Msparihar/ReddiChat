#!/bin/bash

# ReddiChat Deployment Script
# This script stops and starts both frontend and backend services using pm2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/path/to/your/project"  # Update this path
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
PM2_BACKEND_NAME="reddichat-backend"
PM2_FRONTEND_NAME="reddichat-frontend"

# Default ports (can be overridden by environment variables)
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

echo -e "${GREEN}=== ReddiChat Deployment Script ===${NC}"

# Check if pm2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}Error: pm2 is not installed. Please install it first:${NC}"
    echo "npm install -g pm2"
    exit 1
fi

# Check if uv is installed (for Python backend)
if ! command -v uv &> /dev/null; then
    echo -e "${RED}Error: uv is not installed. Please install it first:${NC}"
    echo "pip install uv"
    exit 1
fi

# Check if node/npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Function to stop a service
stop_service() {
    local service_name=$1
    echo -e "${YELLOW}Stopping $service_name...${NC}"
    if pm2 list | grep -q "$service_name"; then
        pm2 stop "$service_name"
        echo -e "${GREEN}$service_name stopped successfully${NC}"
    else
        echo -e "${YELLOW}$service_name is not running${NC}"
    fi
}

# Function to start backend service
start_backend() {
    echo -e "${YELLOW}Starting backend service...${NC}"

    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        echo -e "${RED}Error: Backend directory not found: $BACKEND_DIR${NC}"
        exit 1
    fi

    # Change to backend directory
    cd "$BACKEND_DIR"

    # Install Python dependencies using uv
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    uv sync

    # Start backend with pm2 using uv
    pm2 start "uv run python -m app.main" --name "$PM2_BACKEND_NAME" --interpreter none

    echo -e "${GREEN}Backend service started successfully${NC}"
}

# Function to start frontend service
start_frontend() {
    echo -e "${YELLOW}Starting frontend service...${NC}"

    # Check if frontend directory exists
    if [ ! -d "$FRONTEND_DIR" ]; then
        echo -e "${RED}Error: Frontend directory not found: $FRONTEND_DIR${NC}"
        exit 1
    fi

    # Change to frontend directory
    cd "$FRONTEND_DIR"

    # Install Node.js dependencies
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    npm install

    # Build the frontend
    echo -e "${YELLOW}Building frontend...${NC}"
    npm run build

    # Start frontend with pm2
    pm2 start "npm" --name "$PM2_FRONTEND_NAME" -- run preview --host

    echo -e "${GREEN}Frontend service started successfully${NC}"
}

# Main deployment logic
main() {
    echo -e "${YELLOW}Starting deployment process...${NC}"

    # Stop existing services
    stop_service "$PM2_BACKEND_NAME"
    stop_service "$PM2_FRONTEND_NAME"

    # Remove any existing pm2 processes with same names
    echo -e "${YELLOW}Cleaning up existing processes...${NC}"
    pm2 delete "$PM2_BACKEND_NAME" 2>/dev/null || true
    pm2 delete "$PM2_FRONTEND_NAME" 2>/dev/null || true

    # Start services
    start_backend
    start_frontend

    # Save pm2 configuration
    echo -e "${YELLOW}Saving pm2 configuration...${NC}"
    pm2 save

    # Show status
    echo -e "${YELLOW}Current pm2 status:${NC}"
    pm2 list

    echo -e "${GREEN}=== Deployment completed successfully! ===${NC}"
    echo -e "${GREEN}Backend is running on port $BACKEND_PORT${NC}"
    echo -e "${GREEN}Frontend is running on port $FRONTEND_PORT${NC}"
}

# Run main function
main
