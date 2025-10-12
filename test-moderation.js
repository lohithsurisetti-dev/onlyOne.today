/**
 * Moderation System Test Suite
 * Run: node test-moderation.js
 */

// Import the moderation functions
const { moderateContent, getModerationMessage } = require('./lib/services/moderation.ts')

// Test cases
const testCases = [
  // ✅ SHOULD PASS
  {
    name: 'Valid: Simple action',
    content: 'Made banana bread today',
    shouldPass: true
  },
  {
    name: 'Valid: Creative activity',
    content: 'Listened to Taylor Swift Lover album',
    shouldPass: true
  },
  {
    name: 'Valid: Negative action',
    content: "Didn't check social media all day",
    shouldPass: true
  },
  {
    name: 'Valid: Daily routine',
    content: 'Woke up at 6am, meditated, worked from home, took a walk, cooked dinner, read a book',
    shouldPass: true
  },
  
  // ❌ SHOULD FAIL - Phone Numbers
  {
    name: 'Block: Phone number (dashes)',
    content: 'Call me at 123-456-7890',
    shouldPass: false,
    expectedReason: 'Phone numbers are not allowed for your safety'
  },
  {
    name: 'Block: Phone number (dots)',
    content: 'My number is 123.456.7890',
    shouldPass: false,
    expectedReason: 'Phone numbers are not allowed for your safety'
  },
  {
    name: 'Block: Phone number (spaces)',
    content: 'Contact 123 456 7890',
    shouldPass: false,
    expectedReason: 'Phone numbers are not allowed for your safety'
  },
  {
    name: 'Block: Phone number (no separator)',
    content: 'Text me 1234567890',
    shouldPass: false,
    expectedReason: 'Phone numbers are not allowed for your safety'
  },
  {
    name: 'Block: Phone number (international)',
    content: 'WhatsApp +1-123-456-7890',
    shouldPass: false,
    expectedReason: 'Phone numbers are not allowed for your safety'
  },
  {
    name: 'Block: Phone number (parentheses)',
    content: 'Call (123) 456-7890',
    shouldPass: false,
    expectedReason: 'Phone numbers are not allowed for your safety'
  },
  
  // ❌ SHOULD FAIL - Email
  {
    name: 'Block: Email address',
    content: 'Email me at test@example.com',
    shouldPass: false,
    expectedReason: 'Email addresses are not allowed for your safety'
  },
  {
    name: 'Block: Email with subdomain',
    content: 'Contact user@mail.example.com',
    shouldPass: false,
    expectedReason: 'Email addresses are not allowed for your safety'
  },
  
  // ❌ SHOULD FAIL - URLs
  {
    name: 'Block: URL with http',
    content: 'Check out http://example.com',
    shouldPass: false,
    expectedReason: 'URLs and links are not allowed'
  },
  {
    name: 'Block: URL with https',
    content: 'Visit https://example.com',
    shouldPass: false,
    expectedReason: 'URLs and links are not allowed'
  },
  {
    name: 'Block: URL with www',
    content: 'Go to www.example.com',
    shouldPass: false,
    expectedReason: 'URLs and links are not allowed'
  },
  {
    name: 'Block: Domain only',
    content: 'Check example.com',
    shouldPass: false,
    expectedReason: 'URLs and links are not allowed'
  },
  
  // ❌ SHOULD FAIL - Social Media
  {
    name: 'Block: Twitter handle',
    content: 'Follow me @username',
    shouldPass: false,
    expectedReason: 'Social media handles and usernames are not allowed'
  },
  {
    name: 'Block: Instagram mention',
    content: 'Find me on Instagram @user123',
    shouldPass: false,
    expectedReason: 'Social media handles and usernames are not allowed'
  },
  {
    name: 'Block: Platform name',
    content: 'Add me on snapchat',
    shouldPass: false,
    expectedReason: 'Social media handles and usernames are not allowed'
  },
  
  // ❌ SHOULD FAIL - Explicit Content
  {
    name: 'Block: Explicit keyword',
    content: 'Watched porn',
    shouldPass: false,
    expectedReason: 'Content contains inappropriate material'
  },
  {
    name: 'Block: NSFW content',
    content: 'Posted nsfw content',
    shouldPass: false,
    expectedReason: 'Content contains inappropriate material'
  },
  
  // ❌ SHOULD FAIL - Violence
  {
    name: 'Block: Self-harm',
    content: 'Want to hurt myself',
    shouldPass: false,
    expectedReason: 'Content contains concerning language. Please seek help if needed.'
  },
  {
    name: 'Block: Suicide mention',
    content: 'Thinking about suicide',
    shouldPass: false,
    expectedReason: 'Content contains concerning language. Please seek help if needed.'
  },
  
  // ❌ SHOULD FAIL - Spam
  {
    name: 'Block: Repeated characters',
    content: 'aaaaaaaaaaa',
    shouldPass: false,
    expectedReason: 'Content appears to be spam'
  },
  {
    name: 'Block: Commercial spam',
    content: 'Buy now and get rich quick',
    shouldPass: false,
    expectedReason: 'Content appears to be spam'
  },
  
  // ❌ SHOULD FAIL - Length
  {
    name: 'Block: Too short',
    content: 'ab',
    shouldPass: false,
    expectedReason: 'Content is too short. Please be more descriptive.'
  },
  {
    name: 'Block: Too long',
    content: 'a'.repeat(501),
    shouldPass: false,
    expectedReason: 'Content is too long. Please keep it brief.'
  },
  {
    name: 'Block: Empty',
    content: '',
    shouldPass: false,
    expectedReason: 'Content cannot be empty'
  },
]

// Run tests
console.log('\n🧪 Testing Moderation System\n')
console.log('=' .repeat(60))

let passed = 0
let failed = 0

testCases.forEach((test, index) => {
  const result = moderateContent(test.content)
  const testPassed = result.allowed === test.shouldPass
  
  if (testPassed) {
    passed++
    console.log(`\n✅ Test ${index + 1}: ${test.name}`)
    console.log(`   Content: "${test.content.substring(0, 50)}${test.content.length > 50 ? '...' : ''}"`)
    console.log(`   Result: ${result.allowed ? 'ALLOWED' : 'BLOCKED'}`)
    if (!result.allowed) {
      console.log(`   Reason: ${result.reason}`)
      console.log(`   Message: ${getModerationMessage(result)}`)
    }
  } else {
    failed++
    console.log(`\n❌ Test ${index + 1}: ${test.name}`)
    console.log(`   Content: "${test.content.substring(0, 50)}${test.content.length > 50 ? '...' : ''}"`)
    console.log(`   Expected: ${test.shouldPass ? 'ALLOW' : 'BLOCK'}`)
    console.log(`   Got: ${result.allowed ? 'ALLOW' : 'BLOCK'}`)
    if (!result.allowed) {
      console.log(`   Reason: ${result.reason}`)
      if (test.expectedReason && result.reason !== test.expectedReason) {
        console.log(`   Expected Reason: ${test.expectedReason}`)
      }
    }
  }
})

console.log('\n' + '='.repeat(60))
console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed`)
console.log(`   ✅ Passed: ${passed}`)
console.log(`   ❌ Failed: ${failed}`)
console.log(`   Success Rate: ${Math.round((passed / testCases.length) * 100)}%\n`)

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0)

