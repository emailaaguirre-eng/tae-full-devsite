#!/bin/bash
# Database Backup Script
# Backs up SQLite database to a timestamped file

# Navigate to project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR" || exit 1

# Database file location
DB_FILE="prisma/dev.db"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "Error: Database file $DB_FILE not found"
    exit 1
fi

# Create backup
cp "$DB_FILE" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Database backed up successfully to: $BACKUP_FILE"
    
    # Optional: Keep only last 30 backups
    ls -t "$BACKUP_DIR"/db_backup_*.db | tail -n +31 | xargs rm -f 2>/dev/null
    
    echo "Backup complete"
else
    echo "Error: Backup failed"
    exit 1
fi

