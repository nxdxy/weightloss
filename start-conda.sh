#!/bin/bash

# AI Fitness Pal - Conda Environment Startup Script
# This script specifically uses conda for Python environment management

set -e

echo "🚀 AI Fitness Pal - Conda Development Environment Setup"
echo "======================================================"

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
    else
        print_error "Conda is not installed or not in PATH."
        print_error "Please install Anaconda or Miniconda first:"
        print_error "  - Anaconda: https://www.anaconda.com/products/distribution"
        print_error "  - Miniconda: https://docs.conda.io/en/latest/miniconda.html"
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
        print_error "You can install it via conda: conda install -c conda-forge nodejs"
        exit 1
    fi
}

# Initialize conda for bash
init_conda() {
    print_status "Initializing conda for bash..."
    
    # Source conda initialization script
    if [ -f "$(conda info --base)/etc/profile.d/conda.sh" ]; then
        source "$(conda info --base)/etc/profile.d/conda.sh"
        print_success "Conda initialized successfully"
    else
        print_error "Could not find conda initialization script"
        exit 1
    fi
}

# Setup backend with conda
setup_backend() {
    print_status "Setting up backend with conda..."
    
    cd backend
    
    # Environment name
    ENV_NAME="ai-fitness-pal"
    
    # Check if conda environment exists
    if conda env list | grep -q "^${ENV_NAME} "; then
        print_status "Conda environment '${ENV_NAME}' already exists"
    else
        print_status "Creating conda environment '${ENV_NAME}' with Python 3.11..."
        conda create -n ${ENV_NAME} python=3.11 -y
        print_success "Conda environment '${ENV_NAME}' created"
    fi
    
    # Activate conda environment
    print_status "Activating conda environment '${ENV_NAME}'..."
    conda activate ${ENV_NAME}
    
    # Verify Python version
    PYTHON_VERSION=$(python --version)
    print_success "Using $PYTHON_VERSION in conda environment"
    
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
    print_success "Backend setup completed!"
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

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start backend in background
    print_status "Starting backend server..."
    cd backend
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
    echo "💡 Tips:"
    echo "  - Demo account: username 'demo', password 'demo123'"
    echo "  - Configure Gemini API key in Settings to enable AI features"
    echo "  - Backend uses conda environment 'ai-fitness-pal'"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for user to stop services
    trap 'print_status "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; print_success "Services stopped"; exit' INT
    wait
}

# Show conda environment info
show_env_info() {
    echo ""
    print_status "Environment Information:"
    echo "  - Conda environment: ai-fitness-pal"
    echo "  - To manually activate: conda activate ai-fitness-pal"
    echo "  - To deactivate: conda deactivate"
    echo "  - To remove environment: conda env remove -n ai-fitness-pal"
    echo ""
}

# Main execution
main() {
    # Check prerequisites
    check_conda
    check_node
    
    # Initialize conda
    init_conda
    
    # Setup services
    setup_backend
    setup_frontend
    
    # Show environment info
    show_env_info
    
    # Start services
    start_services
}

# Run main function
main
