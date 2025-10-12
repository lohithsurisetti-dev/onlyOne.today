#!/bin/bash

# OnlyOne.today API Test Script
# Run this to test the backend APIs locally

BASE_URL="http://localhost:3000"

echo "================================"
echo "OnlyOne.today API Test Suite"
echo "================================"
echo ""

# Test 1: Create a post
echo "Test 1: Creating a new post..."
echo "POST $BASE_URL/api/posts"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Listened to Taylor Swift Lover",
    "inputType": "action",
    "scope": "world",
    "locationCountry": "USA"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Extract post ID for later use
POST_ID=$(echo "$RESPONSE" | jq -r '.post.id // empty')

if [ -z "$POST_ID" ]; then
  echo "❌ Failed to create post"
else
  echo "✅ Post created with ID: $POST_ID"
fi

echo ""
echo "================================"
echo ""

# Test 2: Create another similar post
echo "Test 2: Creating a similar post (should match)..."
echo "POST $BASE_URL/api/posts"
echo ""

RESPONSE2=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Listened to Taylor Swift Lover",
    "inputType": "action",
    "scope": "world",
    "locationCountry": "USA"
  }')

echo "Response:"
echo "$RESPONSE2" | jq '.'
echo ""

MATCH_COUNT=$(echo "$RESPONSE2" | jq -r '.matchCount // 0')
UNIQUENESS=$(echo "$RESPONSE2" | jq -r '.uniquenessScore // 0')

echo "✅ Match Count: $MATCH_COUNT"
echo "✅ Uniqueness Score: $UNIQUENESS"

echo ""
echo "================================"
echo ""

# Test 3: Create a unique post
echo "Test 3: Creating a unique post..."
echo "POST $BASE_URL/api/posts"
echo ""

RESPONSE3=$(curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Wrote a handwritten letter to grandma",
    "inputType": "action",
    "scope": "world",
    "locationCountry": "USA"
  }')

echo "Response:"
echo "$RESPONSE3" | jq '.'
echo ""

UNIQUENESS3=$(echo "$RESPONSE3" | jq -r '.uniquenessScore // 0')
echo "✅ Uniqueness Score: $UNIQUENESS3 (should be 100)"

echo ""
echo "================================"
echo ""

# Test 4: Get all posts
echo "Test 4: Fetching all posts..."
echo "GET $BASE_URL/api/posts?filter=all&limit=10"
echo ""

RESPONSE4=$(curl -s "$BASE_URL/api/posts?filter=all&limit=10")

echo "Response:"
echo "$RESPONSE4" | jq '.'
echo ""

POST_COUNT=$(echo "$RESPONSE4" | jq -r '.posts | length // 0')
echo "✅ Fetched $POST_COUNT posts"

echo ""
echo "================================"
echo ""

# Test 5: Get unique posts only
echo "Test 5: Fetching unique posts..."
echo "GET $BASE_URL/api/posts?filter=unique&limit=10"
echo ""

RESPONSE5=$(curl -s "$BASE_URL/api/posts?filter=unique&limit=10")

echo "Response:"
echo "$RESPONSE5" | jq '.'
echo ""

UNIQUE_COUNT=$(echo "$RESPONSE5" | jq -r '.posts | length // 0')
echo "✅ Fetched $UNIQUE_COUNT unique posts"

echo ""
echo "================================"
echo ""

# Test 6: Get common posts only
echo "Test 6: Fetching common posts..."
echo "GET $BASE_URL/api/posts?filter=common&limit=10"
echo ""

RESPONSE6=$(curl -s "$BASE_URL/api/posts?filter=common&limit=10")

echo "Response:"
echo "$RESPONSE6" | jq '.'
echo ""

COMMON_COUNT=$(echo "$RESPONSE6" | jq -r '.posts | length // 0')
echo "✅ Fetched $COMMON_COUNT common posts"

echo ""
echo "================================"
echo ""

# Test 7: Test with different scopes
echo "Test 7: Creating posts with different scopes..."
echo ""

# City scope
echo "7a. City scope..."
curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Had pizza for lunch",
    "inputType": "action",
    "scope": "city",
    "locationCity": "New York",
    "locationState": "NY",
    "locationCountry": "USA"
  }' | jq '.uniquenessScore'

echo ""

# State scope
echo "7b. State scope..."
curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Went for a run",
    "inputType": "action",
    "scope": "state",
    "locationState": "California",
    "locationCountry": "USA"
  }' | jq '.uniquenessScore'

echo ""

# Country scope
echo "7c. Country scope..."
curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Watched the sunset",
    "inputType": "action",
    "scope": "country",
    "locationCountry": "USA"
  }' | jq '.uniquenessScore'

echo ""
echo "================================"
echo ""

# Test 8: Test validation
echo "Test 8: Testing validation (should fail)..."
echo ""

echo "8a. Empty content..."
curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "",
    "inputType": "action",
    "scope": "world"
  }' | jq '.'

echo ""

echo "8b. Invalid input type..."
curl -s -X POST "$BASE_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test post",
    "inputType": "invalid",
    "scope": "world"
  }' | jq '.'

echo ""
echo "================================"
echo ""

# Summary
echo "✅ All tests completed!"
echo ""
echo "Summary:"
echo "- Created multiple posts"
echo "- Tested similarity matching"
echo "- Tested uniqueness scoring"
echo "- Tested filtering (all/unique/common)"
echo "- Tested different scopes"
echo "- Tested validation"
echo ""
echo "Next steps:"
echo "1. Check Supabase Table Editor to see posts"
echo "2. Test in browser UI"
echo "3. Deploy to production"
echo ""

