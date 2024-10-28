#!/bin/bash
# update-gossroom.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting TheGossRoom update process...${NC}"

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 successful${NC}"
    else
        if [ "$2" = "critical" ]; then
            echo -e "${RED}✗ Error during $1${NC}"
            exit 1
        else
            echo -e "${YELLOW}! Notice: $1 - continuing...${NC}"
        fi
    fi
}

# Update RSS feeds and generate new content
echo "Running site generator..."
node site-generator.js
check_status "Site generation" "critical"

# Git operations
echo "Performing Git operations..."

# Check if there are any changes to stash
if git status --porcelain | grep -q '^'; then
    git stash
    HAS_STASH=true
    check_status "Stashing changes"
else
    echo "No local changes to save"
    HAS_STASH=false
fi

# Pull latest changes
git pull --rebase origin main
check_status "Pulling remote changes" "critical"

# Only pop stash if we stashed something
if [ "$HAS_STASH" = true ]; then
    git stash pop
    check_status "Applying local changes"
fi

# Check if there are any changes to commit
if git status --porcelain | grep -q '^'; then
    git add .
    check_status "Adding files"

    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    git commit -m "Auto-update: $TIMESTAMP - Updated content and structure"
    check_status "Committing changes"

    git push origin main
    check_status "Pushing to remote"
else
    echo -e "${YELLOW}No changes to commit${NC}"
fi

# Handle data files
echo "Checking data files..."
DATA_DIR="data"
if [ -d "$DATA_DIR" ]; then
    # Backup data files
    BACKUP_DIR="data_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp $DATA_DIR/*.json "$BACKUP_DIR/"
    echo -e "${GREEN}✓ Data files backed up to $BACKUP_DIR${NC}"

    # Merge any changes in data files
    for file in $DATA_DIR/*.json; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            if [ -f "$BACKUP_DIR/$filename" ]; then
                # Here you could add specific merge logic if needed
                echo "Preserving data file: $filename"
            fi
        fi
    done
fi

echo -e "${GREEN}Update process completed successfully!${NC}"

# Check website accessibility
echo "Checking website accessibility..."
curl -s --head https://thegossroom.com > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Website is accessible${NC}"
else
    echo -e "${RED}Website might be down${NC}"
fi

# Optional: Show recent changes
echo -e "\n${YELLOW}Recent changes:${NC}"
git log --oneline -n 5

