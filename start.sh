#!/bin/bash

# AI Fitness Pal - Development Startup Script
# This script helps you start the development environment

set -e

echo "🚀 AI Fitness Pal - Development Environment Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if conda is installed
check_conda() {
    if command -v conda &> /dev/null; then
        CONDA_VERSION=$(conda --version | cut -d' ' -f2)
        print_success "Conda $CONDA_VERSION found"
        return 0
    else
        print_warning "Conda not found, falling back to Python virtual environment"
        return 1
    fi
}

# Check if Python is installed
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
}

# Setup backend with conda
setup_backend_conda() {
    print_status "Setting up backend with conda..."

    cd backend

    # Check if conda environment exists
    ENV_NAME="ai-fitness-pal"
    if conda env list | grep -q "^${ENV_NAME} "; then
        print_status "Conda environment '${ENV_NAME}' already exists"
    else
        print_status "Creating conda environment '${ENV_NAME}'..."
        conda create -n ${ENV_NAME} python=3.11 -y
    fi

    # Activate conda environment
    print_status "Activating conda environment..."
    source $(conda info --base)/etc/profile.d/conda.sh
    conda activate ${ENV_NAME}

    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt

    # Copy environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit backend/.env file to configure your settings"
    fi

    # Initialize database
    print_status "Initializing database..."
    python init_db.py

    cd ..
    print_success "Backend setup completed with conda!"
}

# Setup backend with virtual environment (fallback)
setup_backend_venv() {
    print_status "Setting up backend with virtual environment..."

    cd backend

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt

    # Copy environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit backend/.env file to configure your settings"
    fi

    # Initialize database
    print_status "Initializing database..."
    python init_db.py

    cd ..
    print_success "Backend setup completed with virtual environment!"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Copy environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit frontend/.env file to configure your settings"
    fi
    
    cd ..
    print_success "Frontend setup completed!"
}

# Start services with conda
start_services_conda() {
    print_status "Starting services..."

    # Start backend in background
    print_status "Starting backend server..."
    cd backend
    source $(conda info --base)/etc/profile.d/conda.sh
    conda activate ai-fitness-pal
    python run.py &
    BACKEND_PID=$!
    cd ..

    # Wait a moment for backend to start
    sleep 3

    # Start frontend in background
    print_status "Starting frontend development server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..

    print_success "Services started!"
    echo ""
    echo "🌐 Frontend: http://localhost:8888"
    echo "🔧 Backend API: http://localhost:8889"
    echo "📚 API Docs: http://localhost:8889/docs"
    echo ""
    echo "Press Ctrl+C to stop all services"

    # Wait for user to stop services
    trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
    wait
}

# Start services with virtual environment (fallback)
start_services_venv() {
    print_status "Starting services..."

    # Start backend in background
    print_status "Starting backend server..."
    cd backend
    source venv/bin/activate
    python run.py &
    BACKEND_PID=$!
    cd ..

    # Wait a moment for backend to start
    sleep 3

    # Start frontend in background
    print_status "Starting frontend development server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..

    print_success "Services started!"
    echo ""
    echo "🌐 Frontend: http://localhost:8888"
    echo "🔧 Backend API: http://localhost:8889"
    echo "📚 API Docs: http://localhost:8889/docs"
    echo ""
    echo "Press Ctrl+C to stop all services"

    # Wait for user to stop services
    trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
    wait
}

# Main execution
main() {
    # Check prerequisites
    check_node

    # Check if conda is available
    if check_conda; then
        print_status "Using conda environment..."
        USE_CONDA=true
    else
        print_status "Using Python virtual environment..."
        check_python
        USE_CONDA=false
    fi

    # Setup services
    if [ "$USE_CONDA" = true ]; then
        setup_backend_conda
    else
        setup_backend_venv
    fi

    setup_frontend

    # Start services
    if [ "$USE_CONDA" = true ]; then
        start_services_conda
    else
        start_services_venv
    fi
}

# Run main function
main
