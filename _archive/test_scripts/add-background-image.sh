#!/bin/bash

# Script to add background image to the project
# This will help you add bck.webp to the public folder and commit it

echo "🎨 Adding Background Image to Project"
echo "======================================"
echo ""

# Check if bck.webp exists in current directory
if [ -f "bck.webp" ]; then
    echo "✅ Found bck.webp in current directory"
    
    # Create public directory if it doesn't exist
    mkdir -p public
    
    # Copy the image
    cp bck.webp public/bck.webp
    echo "✅ Copied bck.webp to public/bck.webp"
    
    # Check file size
    SIZE=$(du -h public/bck.webp | cut -f1)
    echo "📦 File size: $SIZE"
    
    # Add to git
    git add public/bck.webp
    echo "✅ Added to git staging"
    
    # Commit
    git commit -m "Add splash screen background image (bck.webp)"
    echo "✅ Committed to git"
    
    echo ""
    echo "🎉 Success! Next steps:"
    echo "   1. Push to repository: git push"
    echo "   2. Wait for Cloudflare Pages to build"
    echo "   3. Image will be at: https://your-domain.pages.dev/bck.webp"
    
else
    echo "❌ bck.webp not found in current directory"
    echo ""
    echo "📋 Instructions:"
    echo "   1. Place your bck.webp file in the project root directory"
    echo "   2. Run this script again: bash add-background-image.sh"
    echo ""
    echo "   OR manually:"
    echo "   1. cp /path/to/your/bck.webp public/bck.webp"
    echo "   2. git add public/bck.webp"
    echo "   3. git commit -m 'Add splash screen background'"
    echo "   4. git push"
fi
