#!/bin/bash
set -e

SERVER="root@187.45.254.170"

echo "Deploying backend..."
ssh $SERVER "cd ~/bluff-pub/the-bluff-pub-backend && git pull && docker compose up -d --build"

echo "Deploy concluido!"
