#!/bin/bash
# Quick setup script for RentMyRide evaluation

echo "🚗 RentMyRide - Quick Setup Script"
echo "=================================="
echo ""

# Create .env files
echo "📝 Creating environment files..."
cp .env.example .env 2>/dev/null || true
cp backend/.env.example backend/.env 2>/dev/null || true
echo "✅ Environment files created"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "   Installing root dependencies..."
npm install --silent
echo "   Installing backend dependencies..."
cd backend && npm install --silent && cd ..
echo "   Installing frontend dependencies..."
cd new_frontend3 && npm install --silent && cd ..
echo "✅ Dependencies installed"
echo ""

# Setup database
echo "🗄️  Setting up database..."
npx prisma db push --schema=prisma/app.schema.prisma --accept-data-loss
echo "✅ Database ready"
echo ""

echo "=================================="
echo "✅ Setup Complete!"
echo ""
echo "To start the application, open 2 terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd new_frontend3 && npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo "=================================="
