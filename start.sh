#!/bin/bash
set -e

echo "🎮 UNO Game Platform - Quick Start"
echo "=================================="
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    
    # Check if docker-compose is available
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose found"
        echo ""
        echo "Starting with Docker Compose..."
        echo ""
        
        # Create env files if they don't exist
        [ -f backend/.env ] || cp backend/.env.example backend/.env
        [ -f frontend/.env.local ] || cp frontend/.env.local.example frontend/.env.local
        
        # Start services
        docker-compose up --build
    else
        echo "❌ Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
else
    echo "❌ Docker not found. Please install Docker or run locally."
    echo ""
    echo "For local development:"
    echo "  1. Start PostgreSQL and Redis"
    echo "  2. cd backend && npm install && npm run dev"
    echo "  3. cd frontend && npm install && npm run dev"
    exit 1
fi
