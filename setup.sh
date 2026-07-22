#!/bin/bash

echo "🚀 Wingman - Setup"
echo "========================"

# Check prerequisites
echo ""
echo "=== Checking prerequisites ==="

# Check Python3
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found: $(python3 --version)"
else
    echo "❌ Python3 not found. Install Python 3.9+ from https://www.python.org/downloads/"
    exit 1
fi

# Check pip
if command -v pip3 &> /dev/null; then
    echo "✅ pip3 found"
else
    echo "❌ pip3 not found. Run: python3 -m ensurepip --upgrade"
    exit 1
fi

# Check Ollama
if command -v ollama &> /dev/null; then
    echo "✅ Ollama found: $(ollama --version 2>/dev/null || echo 'installed')"
else
    echo "❌ Ollama not found. Installing..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Start Ollama in background if not running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "🔄 Starting Ollama..."
    ollama serve &> /dev/null &
    sleep 3
fi

# Check if Qwen model exists, pull if not
if ! ollama list | grep -q "qwen2.5:7b"; then
    echo "📥 Downloading Qwen 2.5 7B model (4.7GB)..."
    ollama pull qwen2.5:7b
fi

echo ""
echo "=== Installing Python dependencies ==="
pip3 install paddlepaddle paddleocr

echo ""
echo "=== Installing Node.js dependencies ==="
npm install

# Create .env if not exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local 2>/dev/null || echo "OLLAMA_MODEL=qwen2.5:7b" > .env.local
fi

echo ""
echo "=== Installing ego lite (browser for social profile fetch) ==="
if command -v ego-browser &> /dev/null; then
    echo "✅ ego-browser already installed: $(command -v ego-browser)"
else
    echo "📥 Downloading ego lite..."
    EGO_DMG=$(mktemp).dmg
    curl -fL --retry 3 --output "$EGO_DMG" "https://cdn.ego.app/releases/ego-lite/latest.dmg"
    echo "⚙️  Mounting and installing..."
    EGO_VOLUME=$(hdiutil attach "$EGO_DMG" -nobrowse | tail -1 | awk '{print $3}')
    if [ -d "$EGO_VOLUME/ego lite.app" ]; then
        cp -R "$EGO_VOLUME/ego lite.app" /Applications/
        echo "✅ ego lite installed to /Applications/ego lite.app"
    fi
    hdiutil detach "$EGO_VOLUME" 2>/dev/null
    rm -f "$EGO_DMG"

    echo ""
    echo "⚠️  IMPORTANT: Complete ego lite onboarding first!"
    echo "   1. Open /Applications/ego lite.app"
    echo "   2. Sign in / complete setup"
    echo "   3. The ego-browser CLI will be available at ~/.local/bin/ego-browser"
    echo "   4. Re-run this script after onboarding to continue"
    echo ""
    echo "   After onboarding, re-run: ./setup.sh"
    exit 0
fi

# Add ~/.local/bin to PATH if not already
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo "📝 Adding ~/.local/bin to PATH in shell config..."
    for rc in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile"; do
        if [ -f "$rc" ]; then
            if ! grep -q '.local/bin' "$rc" 2>/dev/null; then
                echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$rc"
                echo "   Added to $rc"
            fi
        fi
    done
    export PATH="$HOME/.local/bin:$PATH"
fi

# Kill existing dev server if running
if lsof -i :3000 -t > /dev/null 2>&1; then
    echo "🔄 Stopping existing server..."
    kill $(lsof -i :3000 -t) 2>/dev/null
    sleep 2
fi

# Start dev server in background
echo ""
echo "✨ Starting Wingman..."
nohup npm run dev > /tmp/wingman-dev.log 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        echo "✅ Server ready at http://localhost:3000"
        echo "   PID: $SERVER_PID"
        echo "   Logs: /tmp/wingman-dev.log"
        echo ""
        echo "⚠️  First run: PaddleOCR downloads model files (~15MB) on first OCR use."
        echo "   The first screenshot may take ~30s as it downloads models."
        open http://localhost:3000
        exit 0
    fi
    sleep 1
done

echo "❌ Server failed to start. Check /tmp/wingman-dev.log"
exit 1
