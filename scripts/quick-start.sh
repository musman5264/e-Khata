#!/bin/bash

# e-Khata Quick Start Script
# This script helps you set up and run the e-Khata application

set -e

echo "🚀 e-Khata Quick Start"
echo "====================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed."
    echo ""
else
    echo "✅ Dependencies already installed."
    echo ""
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if command -v psql &> /dev/null; then
    if psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw ekhata; then
        echo "✅ Database 'ekhata' exists."
    else
        echo "📊 Creating database 'ekhata'..."
        createdb -U postgres ekhata 2>/dev/null || echo "⚠️  Could not create database. Please create it manually: createdb ekhata"
    fi
else
    echo "⚠️  PostgreSQL client not found. Please ensure PostgreSQL is installed and running."
    echo "   You can also use Docker: docker-compose up -d postgres"
fi
echo ""

# Build the application
echo "🔨 Building the application..."
npm run build
echo "✅ Build complete."
echo ""

echo "✨ Setup complete!"
echo ""
echo "You can now start the application:"
echo "  Development mode: npm run start:dev"
echo "  Production mode:  npm run start:prod"
echo "  With Docker:      docker-compose up -d"
echo ""
echo "Once started, access:"
echo "  API: http://localhost:3000"
echo "  Swagger Docs: http://localhost:3000/api"
echo ""
echo "📖 For more information, see README.md"
