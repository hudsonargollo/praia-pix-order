#!/bin/bash

# Coco Loko Print Server - Mac Service Uninstaller

echo ""
echo "========================================"
echo "  Coco Loko Print Server"
echo "  Mac Service Uninstaller"
echo "========================================"
echo ""

PLIST_FILE="$HOME/Library/LaunchAgents/com.cocoloko.printserver.plist"

if [ ! -f "$PLIST_FILE" ]; then
    echo "Service is not installed!"
    echo ""
    exit 0
fi

echo "Unloading service..."
launchctl unload "$PLIST_FILE"

echo "Removing service file..."
rm "$PLIST_FILE"

echo ""
echo "========================================"
echo "  Uninstallation Complete!"
echo "========================================"
echo ""
echo "The print server service has been removed."
echo "It will no longer start automatically."
echo ""
