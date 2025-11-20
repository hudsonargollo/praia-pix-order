#!/bin/bash

# Coco Loko Print Server - Mac Service Installer
# This script creates a launchd service that starts automatically

echo ""
echo "========================================"
echo "  Coco Loko Print Server"
echo "  Mac Service Installer"
echo "========================================"
echo ""

# Get the absolute path to the print-server directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org"
    echo "Or install via Homebrew: brew install node"
    echo ""
    exit 1
fi

echo "Node.js found: $(node --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "Installing dependencies..."
    echo "This may take a few minutes..."
    echo ""
    cd "$SCRIPT_DIR"
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Failed to install dependencies!"
        echo ""
        exit 1
    fi
    echo ""
    echo "Dependencies installed successfully!"
    echo ""
fi

# Create the launchd plist file
PLIST_FILE="$HOME/Library/LaunchAgents/com.cocoloko.printserver.plist"

echo "Creating launchd service..."
echo ""

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cocoloko.printserver</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$(which node)</string>
        <string>$SCRIPT_DIR/server.js</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/coco-loko-print-server.log</string>
    
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/coco-loko-print-server-error.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PORT</key>
        <string>3001</string>
    </dict>
</dict>
</plist>
EOF

# Load the service
echo "Loading service..."
launchctl load "$PLIST_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  Installation Complete!"
    echo "========================================"
    echo ""
    echo "The print server is now installed as a Mac service."
    echo "It will start automatically when you log in."
    echo ""
    echo "Service details:"
    echo "  Name: com.cocoloko.printserver"
    echo "  Location: $PLIST_FILE"
    echo "  Logs: $HOME/Library/Logs/coco-loko-print-server.log"
    echo ""
    echo "To manage the service:"
    echo "  Stop:    launchctl stop com.cocoloko.printserver"
    echo "  Start:   launchctl start com.cocoloko.printserver"
    echo "  Restart: launchctl kickstart -k gui/\$(id -u)/com.cocoloko.printserver"
    echo ""
    echo "To uninstall the service:"
    echo "  Run: ./uninstall-mac-service.sh"
    echo ""
    echo "The server is now running at: http://localhost:3001"
    echo ""
else
    echo ""
    echo "ERROR: Failed to load service!"
    echo ""
    exit 1
fi
