#!/bin/bash

# Define ports
BACKEND_PORT=3000
FRONTEND_PORT=10086

# Function to kill process by port
kill_port() {
  PORT=$1
  NAME=$2
  PID=$(lsof -t -i:$PORT)
  if [ -n "$PID" ]; then
    echo "Stopping $NAME on port $PORT (PID: $PID)..."
    kill -9 $PID
    echo "$NAME stopped."
  else
    echo "$NAME is not running on port $PORT."
  fi
}

echo "Stopping services..."

# Stop services
kill_port $BACKEND_PORT "Backend"
kill_port $FRONTEND_PORT "Frontend"

echo "------------------------------------------------"
echo "All services stopped."
echo "------------------------------------------------"
