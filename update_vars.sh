#!/bin/bash

# Cloud Build Substitution Variable Update Script for Admin Dashboard
# Updates an existing trigger with variables from a .env file
# Usage: ./update_vars.sh [trigger-id] [env-file]

set -e

# Configuration
AUTO_PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
PROJECT_ID=${PROJECT_ID:-$AUTO_PROJECT_ID}
REGION="europe-west1" 

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: PROJECT_ID=your-project-id $0 [trigger-id] [env-file]"
    echo "Example: PROJECT_ID=parte-484908 $0 f66e1333-66fc-... .env.staging"
    exit 1
fi

TRIGGER_ID=$1
ENV_FILE=$2

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: PROJECT_ID is not set. Please set it or run 'gcloud config set project [ID]'${NC}"
    exit 1
fi

echo "------------------------------------------------"
echo -e "${YELLOW}TARGET PROJECT:${NC} $PROJECT_ID"
echo -e "${YELLOW}TARGET TRIGGER:${NC} $TRIGGER_ID (ID)"
echo -e "${YELLOW}SOURCE FILE:   ${NC} $ENV_FILE"
echo "------------------------------------------------"

# Safety confirmation
read -p "Are you sure you want to update the trigger in project '$PROJECT_ID'? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Update cancelled."
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: File $ENV_FILE not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Reading variables from $ENV_FILE...${NC}"

format_substitutions() {
    local env_file=$1
    local subs=""
    
    while IFS= read -r line || [ -n "$line" ]; do
        line=$(echo "$line" | sed 's/#.*$//' | xargs)
        [[ -z "$line" ]] && continue
        
        local key="${line%%=*}"
        local value="${line#*=}"
        
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        if [[ ! $key =~ ^[A-Z0-9_]+$ ]]; then
            if [[ ! $key =~ ^_[A-Z0-9_]+$ ]]; then
                continue
            fi
        fi

        if [[ ! $key =~ ^_ ]]; then
            key="_${key}"
        fi
        
        local escaped_value=$(echo "$value" | sed 's/\\/\\\\/g' | sed 's/,/\\,/g')
        
        if [ -n "$subs" ]; then
            subs="${subs},${key}=${escaped_value}"
        else
            subs="${key}=${escaped_value}"
        fi
    done < "$env_file"
    
    echo "$subs"
}

SUBSTITUTIONS=$(format_substitutions "$ENV_FILE")

echo -e "${YELLOW}Checking trigger: $TRIGGER_ID...${NC}"

REGION_FLAG=""
# Check regional first, then global
if gcloud beta builds triggers describe "$TRIGGER_ID" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    REGION_FLAG="--region=$REGION"
    echo "Found regional trigger in $REGION"
elif gcloud beta builds triggers describe "$TRIGGER_ID" --project="$PROJECT_ID" &>/dev/null; then
    echo "Found global trigger"
else
    echo -e "${RED}Error: Trigger $TRIGGER_ID not found in global or $REGION${NC}"
    echo -e "${YELLOW}Tip: Use 'gcloud beta builds triggers list --region=$REGION' to find your trigger ID.${NC}"
    exit 1
fi

TEMP_JSON="temp_trigger_$(date +%s).json"
if ! gcloud beta builds triggers describe "$TRIGGER_ID" $REGION_FLAG --project="$PROJECT_ID" --format=json > "$TEMP_JSON"; then
    echo -e "${RED}❌ Failed to fetch trigger configuration.${NC}"
    rm -f "$TEMP_JSON"
    exit 1
fi

python3 - <<EOF
import json
import os

subs_raw = """$SUBSTITUTIONS"""
subs_dict = {}
for item in subs_raw.split(','):
    if '=' in item:
        k, v = item.split('=', 1)
        v = v.replace('\\\\,', ',').replace('\\\\\\\\', '\\\\')
        subs_dict[k] = v

with open('$TEMP_JSON', 'r') as f:
    config = json.load(f)

if 'substitutions' not in config:
    config['substitutions'] = {}
config['substitutions'].update(subs_dict)

for field in ['id', 'createTime', 'resourceName']:
    if field in config:
        del config[field]

with open('$TEMP_JSON', 'w') as f:
    json.dump(config, f, indent=2)
EOF

if gcloud beta builds triggers import $REGION_FLAG --project="$PROJECT_ID" --source="$TEMP_JSON"; then
    echo -e "${GREEN}✅ Successfully updated substitution variables for $TRIGGER_ID${NC}"
else
    echo -e "${RED}❌ Failed to import updated trigger configuration.${NC}"
    exit 1
fi

rm -f "$TEMP_JSON"
