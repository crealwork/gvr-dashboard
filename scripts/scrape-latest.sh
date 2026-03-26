#!/bin/bash
# Download the latest monthly market report PDF from GVR website
set -e

# Determine previous month
YEAR=$(date -d "last month" +%Y 2>/dev/null || date -v-1m +%Y)
MONTH=$(date -d "last month" +%m 2>/dev/null || date -v-1m +%m)
MONTH_NAME=$(date -d "last month" +%B 2>/dev/null || date -v-1m +%B)
MONTH_LOWER=$(echo "$MONTH_NAME" | tr '[:upper:]' '[:lower:]')

FILENAME="${YEAR}${MONTH}.pdf"
OUTPUT_DIR="gvr-market-reports"
OUTPUT_PATH="${OUTPUT_DIR}/${FILENAME}"

if [ -f "$OUTPUT_PATH" ]; then
  echo "File already exists: $OUTPUT_PATH"
  exit 0
fi

mkdir -p "$OUTPUT_DIR"

# Scrape the GVR report page
REPORT_URL="https://www.gvrealtors.ca/market-watch/monthly-market-report/${MONTH_LOWER}-${YEAR}.html"
echo "Fetching report page: $REPORT_URL"

# Use curl to get the page and extract PDF link
PAGE_CONTENT=$(curl -sL "$REPORT_URL")
PDF_URL=$(echo "$PAGE_CONTENT" | grep -oE 'https?://[^"]+\.pdf' | head -1)

if [ -z "$PDF_URL" ]; then
  echo "ERROR: Could not find PDF link on $REPORT_URL"
  exit 1
fi

echo "Downloading PDF: $PDF_URL"
curl -sL -o "$OUTPUT_PATH" "$PDF_URL"

if [ -s "$OUTPUT_PATH" ]; then
  echo "Success: $OUTPUT_PATH"
else
  echo "ERROR: Downloaded file is empty"
  rm -f "$OUTPUT_PATH"
  exit 1
fi
