#!/bin/bash

# Jesse Engine Setup Script for Quant-Edge
# This script installs Jesse and sets up the Python environment

echo "🚀 Setting up Jesse Engine for Quant-Edge..."

# Check if Python 3.10+ is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not found. Please install Python 3.10 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.10"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python $PYTHON_VERSION found, but Python $REQUIRED_VERSION or higher is required."
    exit 1
fi

echo "✅ Python $PYTHON_VERSION found"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Jesse and dependencies
echo "📥 Installing Jesse and dependencies..."
pip install -r requirements-jesse.txt

# Verify installation
echo "🔍 Verifying Jesse installation..."
python3 -c "import jesse.version; print(f'✅ Jesse {jesse.version.__version__} installed successfully')"

# Create Jesse directories
echo "📁 Setting up Jesse directories..."
mkdir -p src/jesse/strategies
mkdir -p src/jesse/data
mkdir -p src/jesse/logs

# Create __init__.py files
touch src/jesse/__init__.py
touch src/jesse/strategies/__init__.py

echo "🎉 Jesse Engine setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your exchange API keys in src/jesse/jesse_config.py"
echo "2. Create your first strategy in src/jesse/strategies/"
echo "3. Run backtests using the Quant-Edge UI"
echo ""
echo "To activate the virtual environment in future sessions:"
echo "source venv/bin/activate"