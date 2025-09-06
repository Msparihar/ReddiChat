#!/bin/bash
# start.sh - manage pm2 processes for frontend and backend

APP_DIR="/root/ReddiChat"
BACKEND_NAME="reddichat-backend"
FRONTEND_NAME="reddichat-frontend"

cd "$APP_DIR" || exit 1

echo ">>> Stopping old pm2 processes..."
pm2 delete "$BACKEND_NAME" >/dev/null 2>&1
pm2 delete "$FRONTEND_NAME" >/dev/null 2>&1

echo ">>> Starting backend..."
cd "$APP_DIR/backend" || exit 1
pm2 start uv --name "$BACKEND_NAME" -- run fastapi run

echo ">>> Starting frontend..."
cd "$APP_DIR/frontend" || exit 1
pm2 start bun --name "$FRONTEND_NAME" -- dev --host 0.0.0.0

echo ">>> Saving pm2 processes..."
pm2 save

echo ">>> Done! Use 'pm2 list' or 'pm2 logs <name>' to check status/logs."
