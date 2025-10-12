#!/bin/bash

# Security Testing Script for OnlyOne.today
# Run this to test security measures

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 OnlyOne.today Security Tests"
echo "================================"
echo ""

# Test 1: SQL Injection Protection
echo -e "${YELLOW}Test 1: SQL Injection Protection${NC}"
response=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{"content":"test; DROP TABLE posts;--","inputType":"action","scope":"world"}' \
  2>&1)

if echo "$response" | grep -q "Invalid content detected"; then
  echo -e "${GREEN}✅ PASS: SQL injection blocked${NC}"
else
  echo -e "${RED}❌ FAIL: SQL injection not blocked${NC}"
fi
echo ""

# Test 2: XSS Protection
echo -e "${YELLOW}Test 2: XSS Protection${NC}"
response=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{"content":"<script>alert(1)</script>","inputType":"action","scope":"world"}' \
  2>&1)

if echo "$response" | grep -q "Invalid content detected"; then
  echo -e "${GREEN}✅ PASS: XSS attempt blocked${NC}"
else
  echo -e "${RED}❌ FAIL: XSS attempt not blocked${NC}"
fi
echo ""

# Test 3: Phone Number Blocking
echo -e "${YELLOW}Test 3: Phone Number Blocking${NC}"
response=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{"content":"Call me at 123-456-7890","inputType":"action","scope":"world"}' \
  2>&1)

if echo "$response" | grep -q "Phone numbers"; then
  echo -e "${GREEN}✅ PASS: Phone number blocked${NC}"
else
  echo -e "${RED}❌ FAIL: Phone number not blocked${NC}"
fi
echo ""

# Test 4: Email Blocking
echo -e "${YELLOW}Test 4: Email Blocking${NC}"
response=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{"content":"Email me at test@example.com","inputType":"action","scope":"world"}' \
  2>&1)

if echo "$response" | grep -q "Email"; then
  echo -e "${GREEN}✅ PASS: Email blocked${NC}"
else
  echo -e "${RED}❌ FAIL: Email not blocked${NC}"
fi
echo ""

# Test 5: URL Blocking
echo -e "${YELLOW}Test 5: URL Blocking${NC}"
response=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{"content":"Check out https://example.com","inputType":"action","scope":"world"}' \
  2>&1)

if echo "$response" | grep -q "URLs and links"; then
  echo -e "${GREEN}✅ PASS: URL blocked${NC}"
else
  echo -e "${RED}❌ FAIL: URL not blocked${NC}"
fi
echo ""

# Test 6: Content Length Validation
echo -e "${YELLOW}Test 6: Content Too Short${NC}"
response=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{"content":"ab","inputType":"action","scope":"world"}' \
  2>&1)

if echo "$response" | grep -q "Minimum length\|too short"; then
  echo -e "${GREEN}✅ PASS: Short content blocked${NC}"
else
  echo -e "${RED}❌ FAIL: Short content not blocked${NC}"
fi
echo ""

# Test 7: Invalid Input Type
echo -e "${YELLOW}Test 7: Invalid Input Type${NC}"
response=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{"content":"Testing invalid type","inputType":"invalid","scope":"world"}' \
  2>&1)

if echo "$response" | grep -q "Invalid"; then
  echo -e "${GREEN}✅ PASS: Invalid input type rejected${NC}"
else
  echo -e "${RED}❌ FAIL: Invalid input type accepted${NC}"
fi
echo ""

# Test 8: Security Headers
echo -e "${YELLOW}Test 8: Security Headers${NC}"
headers=$(curl -s -I "$BASE_URL/" 2>&1)

if echo "$headers" | grep -q "X-Frame-Options"; then
  echo -e "${GREEN}✅ PASS: Security headers present${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: Security headers may not be set${NC}"
fi
echo ""

# Test 9: Rate Limiting (Multiple Requests)
echo -e "${YELLOW}Test 9: Rate Limiting (sending 12 requests)${NC}"
echo "This will take ~3 seconds..."
blocked=0
for i in {1..12}; do
  response=$(curl -s -X POST "$BASE_URL/api/posts" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"Test post $i\",\"inputType\":\"action\",\"scope\":\"world\"}" \
    2>&1)
  
  if echo "$response" | grep -q "Rate limit exceeded"; then
    ((blocked++))
  fi
  sleep 0.2
done

if [ $blocked -gt 0 ]; then
  echo -e "${GREEN}✅ PASS: Rate limiting active ($blocked requests blocked)${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: Rate limiting may not be working (0 requests blocked)${NC}"
fi
echo ""

# Summary
echo "================================"
echo -e "${YELLOW}Security Test Summary${NC}"
echo "================================"
echo "Run 'cat SECURITY.md' for full security documentation"
echo ""

