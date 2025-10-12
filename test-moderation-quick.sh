#!/bin/bash

echo ""
echo "🧪 Testing Moderation Compliance with curl"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000/api/posts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TEST_NUM=0

# Function to run test
run_test() {
    TEST_NUM=$((TEST_NUM + 1))
    local test_name="$1"
    local content="$2"
    local expected="$3"
    
    echo "Test $TEST_NUM: $test_name"
    echo "Content: \"$content\""
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL" \
      -H "Content-Type: application/json" \
      -d "{\"content\":\"$content\",\"inputType\":\"action\",\"scope\":\"world\"}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$expected" = "pass" ]; then
        if [ "$http_code" = "201" ]; then
            echo -e "${GREEN}✅ PASS${NC} - Status: $http_code (Allowed)"
        else
            echo -e "${RED}❌ FAIL${NC} - Status: $http_code (Should be 201)"
            echo "Response: $body"
        fi
    else
        if [ "$http_code" = "400" ]; then
            echo -e "${GREEN}✅ PASS${NC} - Status: $http_code (Blocked)"
            error=$(echo "$body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
            blocked_by=$(echo "$body" | grep -o '"blockedBy":"[^"]*"' | cut -d'"' -f4)
            echo -e "${YELLOW}   Reason:${NC} $error"
            echo -e "${YELLOW}   Blocked by:${NC} $blocked_by"
        else
            echo -e "${RED}❌ FAIL${NC} - Status: $http_code (Should be 400)"
            echo "Response: $body"
        fi
    fi
    echo ""
}

echo "=== ✅ SHOULD PASS (Valid Content) ==="
echo ""

run_test "Valid: Simple action" "Made banana bread today" "pass"
run_test "Valid: Creative activity" "Listened to Taylor Swift Lover album" "pass"
run_test "Valid: Negative action" "Didn't check social media all day" "pass"

echo ""
echo "=== ❌ SHOULD FAIL (Static Rules) ==="
echo ""

run_test "Block: Phone (dashes)" "Call me at 123-456-7890" "block"
run_test "Block: Phone (no separator)" "Text me 1234567890" "block"
run_test "Block: Email" "Email me at test@example.com" "block"
run_test "Block: URL (https)" "Check out https://example.com" "block"
run_test "Block: URL (www)" "Visit www.example.com" "block"
run_test "Block: Social handle" "Follow me @username" "block"
run_test "Block: Platform name" "Add me on instagram" "block"
run_test "Block: Explicit keyword" "Watched porn today" "block"
run_test "Block: Too short" "ab" "block"

echo ""
echo "=== 🤖 SHOULD FAIL (AI Detection) ==="
echo ""

run_test "Block AI: Insult" "You are an idiot and stupid" "block"
run_test "Block AI: Threat" "I will hurt you" "block"
run_test "Block AI: Toxic" "You suck and everyone hates you" "block"
run_test "Block AI: Hate speech" "I hate all those people" "block"

echo ""
echo "=========================================="
echo "✅ Testing Complete!"
echo ""
echo "Check moderation stats:"
echo "curl http://localhost:3000/api/moderation/stats"
echo ""
