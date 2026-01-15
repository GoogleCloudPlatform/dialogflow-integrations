#!/bin/bash
set -e

# Set default port if not provided
export PORT=${PORT:-8080}

# Kill process running on port if exists
pid=$(lsof -ti :$PORT)
if [ ! -z "$pid" ]; then
  echo "Killing process $pid on port $PORT..."
  kill -9 $pid
fi

echo "Starting webchat-proxy locally on port $PORT..."
go run ./cmd/webchat-proxy
