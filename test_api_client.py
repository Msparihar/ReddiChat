#!/usr/bin/env python3
"""
Enhanced Python script to generate JWT tokens and call ReddiChat APIs in parallel with increased load.
This script will:
1. Connect to the database to get user information
2. Generate JWT tokens for users
3. Make parallel API calls to get chat history and conversation details
4. Log response times for each query and total time
5. Support configurable load testing parameters
"""

import asyncio
import aiohttp
import time
import os
import argparse
import statistics
from datetime import datetime, timedelta, timezone
from jose import jwt
import psycopg2
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv("./backend/.env")

# Configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api/v1"

# Database configuration from .env
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# API endpoints
CHAT_HISTORY_ENDPOINT = f"{API_PREFIX}/chat/history/conversations"
CHAT_CONVERSATION_ENDPOINT = f"{API_PREFIX}/chat/history/conversations"


def get_users_from_db():
    """
    Connect to the database and retrieve user information.
    Returns a list of user dictionaries with id and email.
    """
    try:
        # Parse the DATABASE_URL to extract connection parameters
        # Format: postgresql://user:password@host:port/database
        import re

        match = re.match(r"postgresql://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/([^?]+)", DATABASE_URL)
        if not match:
            print("Error: Could not parse DATABASE_URL")
            return []

        user, password, host, port, database = match.groups()
        port = port or "5432"  # Default PostgreSQL port

        # Connect to the database
        conn = psycopg2.connect(host=host, port=port, database=database, user=user, password=password)

        cursor = conn.cursor()
        # Query to get users (limit to 10 for increased load)
        cursor.execute("SELECT id, email FROM users LIMIT 10")
        rows = cursor.fetchall()

        users = []
        for row in rows:
            users.append({"id": str(row[0]), "email": row[1]})

        cursor.close()
        conn.close()

        print(f"Retrieved {len(users)} users from database")
        return users
    except Exception as e:
        print(f"Error connecting to database: {e}")
        # Return example users if database connection fails
        return [
            {"id": str(uuid.uuid4()), "email": "example1@gmail.com"},
            {"id": str(uuid.uuid4()), "email": "example2@gmail.com"},
            {"id": str(uuid.uuid4()), "email": "example3@gmail.com"},
        ]


def create_access_token(user_id: str) -> str:
    """
    Create a JWT access token for a user.
    """
    to_encode = {"sub": user_id}
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt


async def fetch_chat_history(session, user, token):
    """
    Fetch chat history for a user.
    """
    url = f"{BASE_URL}{CHAT_HISTORY_ENDPOINT}"
    headers = {"Authorization": f"Bearer {token}"}

    start_time = time.time()
    try:
        async with session.get(url, headers=headers) as response:
            response_time = time.time() - start_time
            data = await response.json()
            return {
                "user_email": user["email"],
                "endpoint": "chat_history",
                "status": response.status,
                "response_time": response_time,
                "data": data,
            }
    except Exception as e:
        response_time = time.time() - start_time
        return {
            "user_email": user["email"],
            "endpoint": "chat_history",
            "status": "error",
            "response_time": response_time,
            "error": str(e),
        }


async def fetch_random_conversation(session, user, token):
    """
    Fetch a random conversation for a user (if any exist).
    """
    # First get the list of conversations
    url = f"{BASE_URL}{CHAT_HISTORY_ENDPOINT}"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                conversations = data.get("conversations", [])
                if conversations:
                    # Pick the first conversation
                    conversation_id = conversations[0]["id"]
                    # Fetch the conversation details
                    conv_url = f"{BASE_URL}{CHAT_HISTORY_ENDPOINT}/{conversation_id}"
                    start_time = time.time()
                    async with session.get(conv_url, headers=headers) as conv_response:
                        response_time = time.time() - start_time
                        conv_data = await conv_response.json()
                        return {
                            "user_email": user["email"],
                            "endpoint": f"conversation_{conversation_id}",
                            "status": conv_response.status,
                            "response_time": response_time,
                            "data": conv_data,
                        }
                else:
                    return {
                        "user_email": user["email"],
                        "endpoint": "conversation",
                        "status": "no_data",
                        "response_time": 0,
                        "message": "No conversations found",
                    }
            else:
                return {
                    "user_email": user["email"],
                    "endpoint": "conversation_list",
                    "status": response.status,
                    "response_time": 0,
                    "error": "Failed to get conversation list",
                }
    except Exception as e:
        return {
            "user_email": user["email"],
            "endpoint": "conversation",
            "status": "error",
            "response_time": 0,
            "error": str(e),
        }


async def fetch_multiple_chat_histories(session, user, token, count=3):
    """
    Fetch chat history multiple times for a user to increase load.
    """
    tasks = []
    for i in range(count):
        tasks.append(fetch_chat_history(session, user, token))
    return await asyncio.gather(*tasks)


async def fetch_multiple_conversations(session, user, token, count=2):
    """
    Fetch multiple conversations for a user to increase load.
    """
    tasks = []
    for i in range(count):
        tasks.append(fetch_random_conversation(session, user, token))
    return await asyncio.gather(*tasks)


async def make_api_calls():
    """
    Main function to make parallel API calls with increased load.
    """
    # Get users from database
    users = get_users_from_db()
    if not users:
        print("No users found. Exiting.")
        return

    # Create tokens for each user
    user_tokens = []
    for user in users:
        token = create_access_token(user["id"])
        user_tokens.append((user, token))

    # Create aiohttp session
    async with aiohttp.ClientSession() as session:
        # Prepare tasks
        tasks = []

        # For each user, create multiple tasks for different API calls
        for user, token in user_tokens:
            # Fetch chat history multiple times
            tasks.append(fetch_multiple_chat_histories(session, user, token, 3))
            # Fetch multiple conversations
            tasks.append(fetch_multiple_conversations(session, user, token, 2))

        # Measure total time
        total_start_time = time.time()

        # Execute all tasks in parallel
        results = await asyncio.gather(*tasks)

        total_time = time.time() - total_start_time

        # Flatten results (since we now have nested lists)
        flattened_results = []
        for result_group in results:
            if isinstance(result_group, list):
                flattened_results.extend(result_group)
            else:
                flattened_results.append(result_group)

        # Calculate enhanced performance metrics
        response_times = [r["response_time"] for r in flattened_results if r["response_time"] > 0]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            min_response_time = min(response_times)
            max_response_time = max(response_times)
            percentile_50 = statistics.median(response_times)
            percentile_90 = statistics.quantiles(response_times, n=10)[8] if len(response_times) >= 10 else 0
            percentile_95 = statistics.quantiles(response_times, n=20)[18] if len(response_times) >= 20 else 0
            requests_per_second = len(flattened_results) / total_time if total_time > 0 else 0
        else:
            avg_response_time = min_response_time = max_response_time = percentile_50 = percentile_90 = (
                percentile_95
            ) = requests_per_second = 0

        # Log results
        print("\n" + "=" * 80)
        print("API CALL RESULTS")
        print("=" * 80)

        successful = 0
        failed = 0

        for result in flattened_results:
            print(f"\nUser: {result['user_email']}")
            print(f"Endpoint: {result['endpoint']}")
            print(f"Status: {result['status']}")
            print(f"Response Time: {result['response_time']:.4f} seconds")
            if result["status"] == 200:
                successful += 1
            else:
                failed += 1
            if "error" in result:
                print(f"Error: {result['error']}")
            elif "message" in result:
                print(f"Message: {result['message']}")
            else:
                # Show some data details
                if "data" in result:
                    data = result["data"]
                    if "conversations" in data:
                        print(f"Conversations Count: {len(data['conversations'])}")
                    elif "messages" in data:
                        print(f"Messages Count: {len(data.get('messages', []))}")

        print("\n" + "=" * 80)
        print("PERFORMANCE SUMMARY")
        print("=" * 80)
        print(f"Total Execution Time: {total_time:.4f} seconds")
        print(f"Number of API Calls: {len(flattened_results)}")
        print(f"Average Response Time: {avg_response_time:.4f} seconds")
        print(f"Min Response Time: {min_response_time:.4f} seconds")
        print(f"Max Response Time: {max_response_time:.4f} seconds")
        print(f"50th Percentile (Median): {percentile_50:.4f} seconds")
        print(f"90th Percentile: {percentile_90:.4f} seconds")
        print(f"95th Percentile: {percentile_95:.4f} seconds")
        print(f"Requests Per Second: {requests_per_second:.2f}")

        # Count successful vs failed requests
        print(f"Successful Requests: {successful}")
        print(f"Failed Requests: {failed}")


if __name__ == "__main__":
    print("Starting ReddiChat API Client...")
    print(f"Base URL: {BASE_URL}")

    # Run the async function
    asyncio.run(make_api_calls())
