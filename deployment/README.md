# ReddiChat Deployment

This directory contains the deployment script for ReddiChat application.

## Deployment Script

The `deploy.sh` script automates the deployment process for both frontend and backend services using pm2.

### Features

- Stops existing services before deployment
- Installs dependencies for both frontend and backend
- Builds the frontend application
- Starts both services using pm2 process manager
- Saves pm2 configuration for automatic restart

### Prerequisites

1. **pm2** - Process manager for Node.js applications

   ```bash
   npm install -g pm2
   ```

2. **uv** - Python package installer and resolver

   ```bash
   pip install uv
   ```

3. **Node.js** - Required for frontend build process

### Configuration

Before running the deployment script, update the following variables in `deploy.sh`:

```bash
PROJECT_DIR="/path/to/your/project"  # Update this path
```

### Usage

1. Make the script executable (already done):

   ```bash
   chmod +x deploy.sh
   ```

2. Run the deployment script:

   ```bash
   ./deploy.sh
   ```

### Services Management

The script manages two services:

1. **Backend Service** (`reddichat-backend`)
   - Runs on port 8000 (default)
   - Uses uv to run the Python application
   - Process name: `reddichat-backend`

2. **Frontend Service** (`reddichat-frontend`)
   - Runs on port 5173 (default)
   - Builds and serves the React application
   - Process name: `reddichat-frontend`

### Manual pm2 Commands

After deployment, you can manage services manually using pm2:

```bash
# List all processes
pm2 list

# Stop a service
pm2 stop reddichat-backend
pm2 stop reddichat-frontend

# Start a service
pm2 start reddichat-backend
pm2 start reddichat-frontend

# Restart a service
pm2 restart reddichat-backend
pm2 restart reddichat-frontend

# View logs
pm2 logs reddichat-backend
pm2 logs reddichat-frontend

# Delete a service
pm2 delete reddichat-backend
pm2 delete reddichat-frontend
```

### Environment Variables

The deployment script expects the following environment files:

**Backend** (`backend/.env`):

- `DATABASE_URL` - Database connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `SECRET_KEY` - Application secret key
- `PORT` - Backend port (default: 8000)

**Frontend** (`frontend/.env`):

- `VITE_API_BASE_URL` - Backend API URL (e.g., <http://localhost:8000>)

### Troubleshooting

1. **Permission denied**: Make sure the script is executable
2. **Command not found**: Ensure pm2 and uv are installed
3. **Port conflicts**: Check if ports 8000 and 5173 are available
4. **Dependency issues**: Run `npm install` and `uv sync` manually if needed

### Customization

You can customize the deployment by setting environment variables:

```bash
export BACKEND_PORT=3000
export FRONTEND_PORT=3001
./deploy.sh
