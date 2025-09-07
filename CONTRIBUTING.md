# Contributing to ReddiChat

Thank you for your interest in contributing to ReddiChat! We welcome contributions from the community.

## Getting Started

### Prerequisites

- Python 3.13+ (for backend)
- Node.js 18+ (for frontend)
- Git
- Docker (optional)

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/ReddiChat.git
   cd ReddiChat
   ```

2. **Backend Setup**

   ```bash
   cd backend
   pip install uv
   uv install
   cp .env.example .env  # Configure your environment variables
   uv run uvicorn app.main:app --reload
   ```

3. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## How to Contribute

### 🐛 Bug Reports

- Use the issue tracker to report bugs
- Include steps to reproduce
- Provide environment details

### ✨ Feature Requests

- Open an issue describing the feature
- Explain the use case and benefits
- Discuss implementation approach

### 🔧 Code Contributions

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

3. **Test Your Changes**

   ```bash
   # Backend tests
   cd backend && uv run pytest

   # Frontend tests
   cd frontend && npm test
   ```

4. **Submit Pull Request**
   - Clear description of changes
   - Link to related issues
   - Include screenshots for UI changes

## Code Style

### Backend (Python)

- Follow PEP 8
- Use type hints
- Add docstrings for functions
- Use async/await for I/O operations

### Frontend (React)

- Use functional components with hooks
- Follow ESLint configuration
- Use TypeScript-style prop validation
- Maintain responsive design

## Project Structure

```
ReddiChat/
├── backend/          # FastAPI backend
│   ├── app/         # Main application code
│   ├── tests/       # Test files
│   └── docs/        # API documentation
├── frontend/        # React frontend
│   ├── src/         # Source code
│   └── public/      # Static assets
├── deployment/      # Deployment scripts
└── assets/         # Project media files
```

## Questions?

Feel free to open an issue for any questions or reach out to the maintainers.

Happy coding! 🚀
