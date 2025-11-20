#!/bin/bash

# Fix Mac USB permissions for thermal printer

echo ""
echo "========================================"
echo "  Fix Mac USB Permissions"
echo "========================================"
echo ""

echo "This script will help fix USB permissions for the thermal printer."
echo ""
echo "Option 1: Run server with sudo (Quick fix)"
echo "  sudo npm start"
echo ""
echo "Option 2: Add udev rules (Permanent fix)"
echo "  This requires creating a rule file"
echo ""

read -p "Do you want to run the server with sudo now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Starting server with sudo..."
    echo "You may be prompted for your password."
    echo ""
    sudo npm start
fi
