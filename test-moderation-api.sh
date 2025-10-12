#!/bin/bash

# Moderation API Test Script
# Requires: Server running on localhost:3000
# Usage: ./test-moderation-api.sh

echo ""
echo "🧪 Testing Moderation API"
echo "================================"
echo ""

# Base URL
BASE_URL="http://localhost:3000/api/posts"

# Test 1: Valid content (should succeed)
echo "✅ Test 1: Valid content"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Made banana bread today","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Phone number (should fail)
echo "❌ Test 2: Phone number"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Call me at 123-456-7890","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: Email (should fail)
echo "❌ Test 3: Email address"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Email me at test@example.com","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 4: URL (should fail)
echo "❌ Test 4: URL"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Check out https://example.com","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 5: Social media handle (should fail)
echo "❌ Test 5: Social media handle"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Follow me @username on twitter","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 6: Explicit content (should fail)
echo "❌ Test 6: Explicit content"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Watched porn today","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 7: Too short (should fail)
echo "❌ Test 7: Too short"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"ab","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 8: Valid creative content (should succeed)
echo "✅ Test 8: Valid creative content"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Listened to Taylor Swift Lover album while baking","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 9: Valid negative action (should succeed)
echo "✅ Test 9: Valid negative action"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Didnt check social media all day","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

# Test 10: Self-harm keyword (should fail)
echo "❌ Test 10: Self-harm keyword"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"content":"Want to hurt myself","inputType":"action","scope":"world"}' \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "================================"
echo "✅ Tests complete!"
echo ""
echo "Expected results:"
echo "  - Tests 1, 8, 9: Status 201 (Created)"
echo "  - Tests 2-7, 10: Status 400 (Bad Request)"
echo ""

