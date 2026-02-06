#!/bin/bash
echo "VERCEL_ENV: $VERCEL_ENV"

# 1. Install Backend Dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# 2. Build Frontend
echo "Building Frontend..."
cd frontend
npm install
npm run build
echo "Frontend Build Complete"

# 3. Move Artifacts (Optional/Safety)
# If Vercel root is '.', Next.js output is in frontend/.next
# Ensure Vercel knows where to find outputs via Project Settings > Output Directory
