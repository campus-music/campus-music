#!/bin/bash
# Build script for Campus Music
# This script builds the frontend and backend, then copies static data files

set -e

echo "🔨 Building frontend with Vite..."
npx vite build

echo "🔨 Building backend with esbuild..."
npx esbuild server/index-prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js

echo "📁 Copying data files to dist..."
mkdir -p dist/data
cp -R server/data/* dist/data/

echo "✅ Build complete!"
echo "📂 Contents of dist/data:"
ls -la dist/data/
