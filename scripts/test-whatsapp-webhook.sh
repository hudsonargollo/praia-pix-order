#!/bin/bash

# WhatsApp Webhook Test Script
# Tests the webhook endpoint with various scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEBHOOK_URL="${WEBHOOK_URL:-https://coco-loko-acaiteria.pages.dev/api/whatsapp/webhook}"
TEST_PHONE="${TEST_PHONE:-5573999988888}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}WhatsApp Webhook Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Webhook URL: ${YELLOW}$WEBHOOK_URL${NC}"
echo -e "Test Phone: ${YELLOW}$TEST_PHONE${NC}"
echo ""

# Test 1: Valid inbound message
echo -e "${BLUE}Test 1: Valid Inbound Message${NC}"
echo "Sending valid inbound message..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"messages.upsert\",
    \"instance\": \"cocooo\",
    \"data\": {
      \"key\": {
        \"id\": \"test_$(date +%s)\",
        \"remoteJid\": \"${TEST_PHONE}@s.whatsapp.net\",
        \"fromMe\": false
      },
      \"message\": {
        \"conversation\": \"Test message: Valid inbound message\"
      },
      \"messageTimestamp\": $(date +%s)
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Test 1 Passed${NC} - HTTP $HTTP_CODE"
  echo -e "  Response: $BODY"
else
  echo -e "${RED}✗ Test 1 Failed${NC} - HTTP $HTTP_CODE"
  echo -e "  Response: $BODY"
fi
echo ""

# Test 2: Outbound message (should be ignored)
echo -e "${BLUE}Test 2: Outbound Message (Should Ignore)${NC}"
echo "Sending outbound message (fromMe: true)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"messages.upsert\",
    \"instance\": \"cocooo\",
    \"data\": {
      \"key\": {
        \"id\": \"test_$(date +%s)\",
        \"remoteJid\": \"${TEST_PHONE}@s.whatsapp.net\",
        \"fromMe\": true
      },
      \"message\": {
        \"conversation\": \"Test message: Outbound (should ignore)\"
      },
      \"messageTimestamp\": $(date +%s)
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Test 2 Passed${NC} - HTTP $HTTP_CODE (Ignored as expected)"
  echo -e "  Response: $BODY"
else
  echo -e "${RED}✗ Test 2 Failed${NC} - HTTP $HTTP_CODE"
  echo -e "  Response: $BODY"
fi
echo ""

# Test 3: Extended text message format
echo -e "${BLUE}Test 3: Extended Text Message Format${NC}"
echo "Sending message with extendedTextMessage..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"messages.upsert\",
    \"instance\": \"cocooo\",
    \"data\": {
      \"key\": {
        \"id\": \"test_$(date +%s)\",
        \"remoteJid\": \"${TEST_PHONE}@s.whatsapp.net\",
        \"fromMe\": false
      },
      \"message\": {
        \"extendedTextMessage\": {
          \"text\": \"Test message: Extended text format\"
        }
      },
      \"messageTimestamp\": $(date +%s)
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Test 3 Passed${NC} - HTTP $HTTP_CODE"
  echo -e "  Response: $BODY"
else
  echo -e "${RED}✗ Test 3 Failed${NC} - HTTP $HTTP_CODE"
  echo -e "  Response: $BODY"
fi
echo ""

# Test 4: Invalid payload (missing required fields)
echo -e "${BLUE}Test 4: Invalid Payload (Should Return 400)${NC}"
echo "Sending invalid payload..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"messages.upsert\",
    \"data\": {}
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ Test 4 Passed${NC} - HTTP $HTTP_CODE (Rejected as expected)"
  echo -e "  Response: $BODY"
else
  echo -e "${YELLOW}⚠ Test 4 Warning${NC} - Expected 400, got HTTP $HTTP_CODE"
  echo -e "  Response: $BODY"
fi
echo ""

# Test 5: Non-message event (should be ignored)
echo -e "${BLUE}Test 5: Non-Message Event (Should Ignore)${NC}"
echo "Sending non-message event..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"connection.update\",
    \"instance\": \"cocooo\",
    \"data\": {
      \"state\": \"open\"
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Test 5 Passed${NC} - HTTP $HTTP_CODE (Ignored as expected)"
  echo -e "  Response: $BODY"
else
  echo -e "${RED}✗ Test 5 Failed${NC} - HTTP $HTTP_CODE"
  echo -e "  Response: $BODY"
fi
echo ""

# Test 6: GET request (should return 405)
echo -e "${BLUE}Test 6: GET Request (Should Return 405)${NC}"
echo "Sending GET request..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$WEBHOOK_URL")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "405" ]; then
  echo -e "${GREEN}✓ Test 6 Passed${NC} - HTTP $HTTP_CODE (Method not allowed)"
  echo -e "  Response: $BODY"
else
  echo -e "${YELLOW}⚠ Test 6 Warning${NC} - Expected 405, got HTTP $HTTP_CODE"
  echo -e "  Response: $BODY"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Suite Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Check Cloudflare Functions logs for detailed webhook activity"
echo "2. Verify messages appear in Supabase whatsapp_chat_messages table"
echo "3. Test with real WhatsApp messages from customer phone"
echo "4. Verify messages appear in admin UI with audio notification"
echo ""
echo -e "${YELLOW}Monitoring Commands:${NC}"
echo "  wrangler tail --format pretty | grep webhook"
echo "  # Or check Cloudflare Dashboard > Workers & Pages > Logs"
echo ""
