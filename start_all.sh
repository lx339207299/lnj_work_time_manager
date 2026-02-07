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
  else
    echo "$NAME is not running on port $PORT."
  fi
}

# 1. Stop existing services
kill_port $BACKEND_PORT "Backend"
kill_port $FRONTEND_PORT "Frontend"

# 2. Start Backend
echo "Starting Backend..."
cd server
nohup npm run start:dev > ../backend.log 2>&1 &
echo "Backend starting in background..."

# 3. Start Frontend
echo "Starting Frontend..."
cd ../weapp
nohup npm run dev:h5 > ../frontend.log 2>&1 &
echo "Frontend starting in background..."

echo "------------------------------------------------"
echo "Services started!"
echo "Backend: http://localhost:$BACKEND_PORT"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Logs: backend.log, frontend.log"
echo "------------------------------------------------"
