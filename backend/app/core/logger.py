"""
Logger configuration using Loguru for ReddiChat backend
"""

import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings

# Remove default logger
logger.remove()

# Create logs directory if it doesn't exist
logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)

# Configure console logging with colored output
logger.add(
    sys.stdout,
    level="INFO",
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    colorize=True,
)

# Configure file logging for all logs
logger.add(
    "logs/app.log",
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    rotation="10 MB",
    retention="7 days",
    compression="zip",
)

# Configure error-only file logging
logger.add(
    "logs/errors.log",
    level="ERROR",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    rotation="10 MB",
    retention="30 days",
    compression="zip",
)


def get_logger(name: str = __name__):
    """
    Get a logger instance with the specified name

    Args:
        name: Logger name (usually __name__)

    Returns:
        logger: Configured loguru logger
    """
    return logger.bind(name=name)


# Export the configured logger
__all__ = ["logger", "get_logger"]
