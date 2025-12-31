#!/bin/bash

# BetFun Setup Verification Script
# This script checks if your development environment is properly configured

echo "============================================"
echo "  BetFun Development Setup Verification"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    ((ISSUES++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js installed: $NODE_VERSION"

    # Check if version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        warning "Node.js version is below v18. Please upgrade to v18 or higher."
        ((ISSUES++))
    fi
else
    error "Node.js is not installed. Please install Node.js v18 or higher."
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    success "npm installed: $NPM_VERSION"
else
    error "npm is not installed."
fi

# Check MongoDB
if command -v mongosh &> /dev/null; then
    success "MongoDB Shell (mongosh) installed"

    # Try to connect to MongoDB
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        MONGO_VERSION=$(mongosh --eval "db.version()" --quiet 2>/dev/null | tail -1)
        success "MongoDB is running (version: $MONGO_VERSION)"
    else
        error "MongoDB is installed but not running. Start it with: brew services start mongodb-community"
    fi
else
    warning "MongoDB Shell (mongosh) not found. MongoDB may not be installed."
fi

echo ""
echo "Checking project structure..."
echo ""

# Check if we're in the right directory
if [ ! -d "BackEnd" ] || [ ! -d "FrontEnd" ]; then
    error "Not in BetFun root directory. Please run this script from /Users/sayhieya/BetFun/BetFun/"
    exit 1
else
    success "In correct project directory"
fi

# Check Backend dependencies
if [ -d "BackEnd/node_modules" ]; then
    success "Backend dependencies installed"
else
    error "Backend dependencies not installed. Run: cd BackEnd && npm install"
fi

# Check Frontend dependencies
if [ -d "FrontEnd/node_modules" ]; then
    success "Frontend dependencies installed"
else
    error "Frontend dependencies not installed. Run: cd FrontEnd && npm install"
fi

echo ""
echo "Checking environment files..."
echo ""

# Check Backend .env
if [ -f "BackEnd/.env" ]; then
    success "Backend .env file exists"

    # Check for required variables
    if grep -q "^PORT=" BackEnd/.env; then
        PORT=$(grep "^PORT=" BackEnd/.env | cut -d'=' -f2)
        success "  PORT set to: $PORT"
    else
        warning "  PORT not set in .env"
    fi

    if grep -q "^DB_URL=" BackEnd/.env; then
        DB_URL=$(grep "^DB_URL=" BackEnd/.env | cut -d'=' -f2)
        if [ -z "$DB_URL" ]; then
            warning "  DB_URL is empty"
        else
            success "  DB_URL configured"
        fi
    else
        error "  DB_URL not found in .env"
    fi

    if grep -q "^ADMIN_WALLET=" BackEnd/.env; then
        ADMIN_WALLET=$(grep "^ADMIN_WALLET=" BackEnd/.env | cut -d'=' -f2)
        if [ -z "$ADMIN_WALLET" ]; then
            warning "  ADMIN_WALLET is empty (needed for admin features)"
        else
            success "  ADMIN_WALLET configured"
        fi
    else
        warning "  ADMIN_WALLET not found in .env"
    fi

    if grep -q "^GATE_TOKEN_MINT=" BackEnd/.env; then
        success "  GATE_TOKEN_MINT configured"
    else
        warning "  GATE_TOKEN_MINT not found in .env"
    fi
else
    error "Backend .env file not found. Copy from: cp BackEnd/env.example BackEnd/.env"
fi

# Check Frontend .env.local
if [ -f "FrontEnd/.env.local" ]; then
    success "Frontend .env.local file exists"

    if grep -q "^NEXT_PUBLIC_GATE_TOKEN_MINT=" FrontEnd/.env.local; then
        success "  NEXT_PUBLIC_GATE_TOKEN_MINT configured"
    else
        warning "  NEXT_PUBLIC_GATE_TOKEN_MINT not found"
    fi
else
    error "Frontend .env.local file not found. Copy from: cp FrontEnd/.env.example FrontEnd/.env.local"
fi

echo ""
echo "Checking configuration files..."
echo ""

# Check if backend URL matches
if [ -f "FrontEnd/src/data/data.ts" ]; then
    FRONTEND_URL=$(grep "export const url" FrontEnd/src/data/data.ts | cut -d'"' -f2)
    success "Frontend API URL: $FRONTEND_URL"

    if [ -f "BackEnd/.env" ]; then
        BACKEND_PORT=$(grep "^PORT=" BackEnd/.env | cut -d'=' -f2)
        EXPECTED_URL="http://localhost:${BACKEND_PORT}/"

        if [ "$FRONTEND_URL" != "$EXPECTED_URL" ]; then
            warning "Frontend URL ($FRONTEND_URL) doesn't match backend PORT ($EXPECTED_URL)"
            warning "Update FrontEnd/src/data/data.ts if needed"
        fi
    fi
fi

echo ""
echo "============================================"
echo "  Verification Summary"
echo "============================================"
echo ""

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You're ready to start development:"
    echo "  1. Terminal 1: cd BackEnd && npm run dev"
    echo "  2. Terminal 2: cd FrontEnd && npm run dev"
    echo "  3. Browser: http://localhost:3000"
else
    echo -e "${RED}✗ Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Please fix the issues above before starting development."
    echo "See QUICK_START.md or LOCAL_DEVELOPMENT.md for help."
fi

echo ""
echo "For detailed setup instructions, see:"
echo "  - QUICK_START.md (quick 10-min setup)"
echo "  - LOCAL_DEVELOPMENT.md (comprehensive guide)"
echo "  - DEPLOYMENT_CHECKLIST.md (production deployment)"
echo ""
