#!/bin/bash

# AI Fitness Pal - Conda Environment Setup Only
# This script only sets up the conda environment without starting services

set -e

echo "🐍 Setting up AI Fitness Pal Conda Environment"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Initialize conda
print_status "Initializing conda..."
source "$(conda info --base)/etc/profile.d/conda.sh"

# Environment name
ENV_NAME="ai-fitness-pal"

# Check if environment exists
if conda env list | grep -q "^${ENV_NAME} "; then
    print_warning "Environment '${ENV_NAME}' already exists"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Removing existing environment..."
        conda env remove -n ${ENV_NAME} -y
    else
        print_status "Using existing environment"
        conda activate ${ENV_NAME}
        print_success "Environment '${ENV_NAME}' activated"
        exit 0
    fi
fi

# Create environment from file if it exists, otherwise create manually
if [ -f "environment.yml" ]; then
    print_status "Creating environment from environment.yml..."
    conda env create -f environment.yml
else
    print_status "Creating environment manually..."
    conda create -n ${ENV_NAME} python=3.11 -y
    conda activate ${ENV_NAME}
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    pip install -r requirements.txt
    cd ..
fi

# Activate environment
print_status "Activating environment..."
conda activate ${ENV_NAME}

# Verify installation
print_status "Verifying installation..."
python --version
pip list | head -10

print_success "Conda environment '${ENV_NAME}' is ready!"
echo ""
echo "To activate the environment manually:"
echo "  conda activate ${ENV_NAME}"
echo ""
echo "To start the application:"
echo "  ./start-conda.sh"
echo ""
echo "To deactivate:"
echo "  conda deactivate"
