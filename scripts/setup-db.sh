#!/bin/bash

# Setup CurrentPrompt Database
# This script runs the SQL migration against your Supabase instance

# Configuration
SUPABASE_URL="https://fhuocowvfrwjygxgzelw.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodW9jb3d2ZnJ3anlneGd6ZWx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIyMDE5MCwiZXhwIjoyMDc4Nzk2MTkwfQ.rqVABi7Bk9wDKu6_q1hxwzlcx8Fy1podd60JPR5RzMA"

echo "Running CurrentPrompt database migration..."
echo "Supabase URL: $SUPABASE_URL"

# Read the migration file
MIGRATION_FILE="migrations/001_create_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: $MIGRATION_FILE not found"
  exit 1
fi

# Execute the migration using curl
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(cat $MIGRATION_FILE | jq -R -s '.')}" \
  2>&1

echo "Migration complete!"
