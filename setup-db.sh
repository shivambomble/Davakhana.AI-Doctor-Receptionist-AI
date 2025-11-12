#!/bin/bash

# Database setup script for Supabase
# Usage: ./setup-db.sh [YOUR_DATABASE_PASSWORD]

if [ -z "$1" ]; then
  echo "Usage: ./setup-db.sh [YOUR_DATABASE_PASSWORD]"
  echo ""
  echo "Get your database password from:"
  echo "https://supabase.com/dashboard/project/sdsuneyrdyxdhcuitowd/settings/database"
  exit 1
fi

DB_PASSWORD=$1
DB_HOST="db.sdsuneyrdyxdhcuitowd.supabase.co"
CONNECTION_STRING="postgresql://postgres:${DB_PASSWORD}@${DB_HOST}:5432/postgres"

echo "🔄 Running schema.sql..."
psql "$CONNECTION_STRING" -f supabase/schema.sql

if [ $? -eq 0 ]; then
  echo "✅ Schema created successfully"
  echo ""
  echo "🔄 Running rpc_functions.sql..."
  psql "$CONNECTION_STRING" -f supabase/rpc_functions.sql
  
  if [ $? -eq 0 ]; then
    echo "✅ RPC functions created successfully"
    echo ""
    echo "🎉 Database setup complete!"
  else
    echo "❌ Failed to create RPC functions"
    exit 1
  fi
else
  echo "❌ Failed to create schema"
  exit 1
fi
