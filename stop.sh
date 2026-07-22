#!/bin/bash

echo "🛑 Stopping Wingman..."

if lsof -i :3000 -t > /dev/null 2>&1; then
    kill $(lsof -i :3000 -t) 2>/dev/null
    echo "✅ Server stopped"
else
    echo "ℹ️  Server not running"
fi
