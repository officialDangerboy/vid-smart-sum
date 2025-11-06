#!/bin/bash

# Video Summarizer API - Setup Script
# Run this script to set up your development environment

echo "🚀 Video Summarizer API - Setup"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ first."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm version: $NPM_VERSION"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Skipping creation."
else
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
fi

echo ""
echo "🔐 Generating secure secrets..."
echo ""

# Generate JWT Secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "JWT_SECRET=$JWT_SECRET"

# Generate JWT Refresh Secret
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"

# Generate Session Secret
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "SESSION_SECRET=$SESSION_SECRET"

# Generate Encryption Key
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"

echo ""
echo "✅ Secrets generated successfully!"
echo ""
echo "📋 IMPORTANT: Copy these secrets to your .env file"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add these to your .env file:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "SESSION_SECRET=$SESSION_SECRET"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask if user wants to automatically update .env
read -p "Would you like to automatically update .env with these secrets? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
        sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" .env
        sed -i '' "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|g" .env
        sed -i '' "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|g" .env
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" .env
        sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|g" .env
        sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|g" .env
    fi
    echo "✅ .env file updated with secrets"
else
    echo "⚠️  Please manually update your .env file with the secrets above"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update .env with your:"
echo "   - MongoDB URI"
echo "   - Google OAuth Client ID & Secret"
echo "   - Frontend URL"
echo ""
echo "2. Get Google OAuth credentials:"
echo "   https://console.cloud.google.com/apis/credentials"
echo ""
echo "3. Start the server:"
echo "   npm run dev"
echo ""
echo "4. Visit:"
echo "   http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Setup complete! Happy coding! 🎉"
echo ""
