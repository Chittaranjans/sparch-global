#!/bin/bash

# AI Job Search Platform - Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting AI Job Search Platform..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in root directory"
    echo "Please create a .env file with your GEMINI_API_KEY"
    exit 1
fi

# Check if frontend/.env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Warning: frontend/.env.local not found, creating it..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > frontend/.env.local
    echo "✅ Created frontend/.env.local"
fi

echo "📦 Installing dependencies..."
echo ""

# Install backend dependencies (if needed)
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    bun install
fi

# Install frontend dependencies (if needed)
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && bun install && cd ..
fi

echo ""
echo "✅ Dependencies installed"
echo ""
echo "🔧 Starting servers..."
echo ""
echo "Backend API:  http://localhost:3000"
echo "Frontend App: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start backend in background
bun start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend in background
cd frontend && bun run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for both processes
wait
