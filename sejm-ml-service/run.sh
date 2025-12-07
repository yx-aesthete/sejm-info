#!/bin/bash

# Sejm ML Service - Quick Start Script

echo "🚀 Sejm ML Service"
echo "=================="
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check .env
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Please copy .env.example and configure it."
    echo "   cp .env.example .env"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Choose an option:"
echo "  1) Start FastAPI server (http://localhost:8001)"
echo "  2) Run law references analysis"
echo "  3) Run process dynamics analysis"
echo "  4) Run voting patterns analysis"
echo "  5) Run success prediction analysis"
echo "  6) Run ALL analyses"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo "🌐 Starting FastAPI server..."
        python -m src.main
        ;;
    2)
        echo "📜 Running law references analysis..."
        python -m src.analyzers.law_references
        ;;
    3)
        echo "⚡ Running process dynamics analysis..."
        python -m src.analyzers.process_dynamics
        ;;
    4)
        echo "🗳️  Running voting patterns analysis..."
        python -m src.analyzers.voting_patterns
        ;;
    5)
        echo "🎯 Running success prediction analysis..."
        python -m src.analyzers.success_prediction
        ;;
    6)
        echo "🔄 Running ALL analyses..."
        python -m src.analyzers.law_references
        echo ""
        python -m src.analyzers.process_dynamics
        echo ""
        python -m src.analyzers.voting_patterns
        echo ""
        python -m src.analyzers.success_prediction
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
