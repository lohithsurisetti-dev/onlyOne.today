# Moderation System Testing Guide

## Quick Tests (Browser UI)

Start your dev server (`npm run dev`) and test these inputs on the home page:

### ✅ **Should PASS** (Post successfully created)

1. **Simple action:**
   ```
   Made banana bread today
   ```

2. **Creative activity:**
   ```
   Listened to Taylor Swift Lover album
   ```

3. **Negative action:**
   ```
   Didn't check social media all day
   ```

4. **Daily routine:**
   ```
   Woke up at 6am, meditated for 20 minutes, worked from home, took a walk, cooked dinner
   ```

5. **Unconventional activity:**
   ```
   Slept for 12 hours straight
   ```

### ❌ **Should FAIL** (Show error message)

#### Phone Numbers

6. **With dashes:**
   ```
   Call me at 123-456-7890
   ```
   Expected: "📵 For your safety, please don't share phone numbers. Keep it anonymous!"

7. **With dots:**
   ```
   My number is 123.456.7890
   ```

8. **With spaces:**
   ```
   Contact 123 456 7890
   ```

9. **No separator:**
   ```
   Text me 1234567890
   ```

10. **International:**
    ```
    WhatsApp +1-123-456-7890
    ```

#### Email Addresses

11. **Basic email:**
    ```
    Email me at test@example.com
    ```
    Expected: "📧 For your safety, please don't share email addresses. Keep it anonymous!"

12. **Email with subdomain:**
    ```
    Contact user@mail.example.com
    ```

#### URLs and Links

13. **HTTP URL:**
    ```
    Check out http://example.com
    ```
    Expected: "🔗 Links aren't allowed. Just share what you did!"

14. **HTTPS URL:**
    ```
    Visit https://example.com
    ```

15. **WWW URL:**
    ```
    Go to www.example.com
    ```

16. **Domain only:**
    ```
    Check example.com for details
    ```

#### Social Media Handles

17. **Twitter handle:**
    ```
    Follow me @username
    ```
    Expected: "📱 Social media handles aren't allowed. Keep it anonymous!"

18. **Instagram mention:**
    ```
    Find me on Instagram @user123
    ```

19. **Platform name:**
    ```
    Add me on snapchat
    ```

#### Explicit Content

20. **Explicit keyword:**
    ```
    Watched porn today
    ```
    Expected: "🚫 This content isn't appropriate for OnlyOne. Keep it wholesome!"

21. **NSFW:**
    ```
    Posted nsfw content
    ```

#### Violence & Self-Harm

22. **Self-harm:**
    ```
    Want to hurt myself
    ```
    Expected: "💜 We noticed concerning language. If you need support, please reach out to a crisis helpline."

23. **Suicide:**
    ```
    Thinking about suicide
    ```

#### Spam

24. **Repeated characters:**
    ```
    aaaaaaaaaaaaaa
    ```
    Expected: "⛔ This looks like spam. Share your real activities!"

25. **Commercial:**
    ```
    Buy now and make $1000 today
    ```

#### Length Issues

26. **Too short:**
    ```
    ab
    ```
    Expected: "✏️ Tell us a bit more! What did you do?"

27. **Too long:**
    ```
    [Type 501 characters]
    ```
    Expected: "✂️ Keep it short and sweet! Max 500 characters."

---

## Automated Testing

### Method 1: API Tests (curl)

```bash
# Make sure server is running on port 3000
npm run dev

# In another terminal, run:
./test-moderation-api.sh
```

Expected output:
- Tests 1, 8, 9: `Status: 201` (Success)
- Tests 2-7, 10: `Status: 400` (Blocked)

### Method 2: Node.js Unit Tests

```bash
# Run the test suite
node test-moderation.js
```

Expected output:
```
🧪 Testing Moderation System
============================================================

✅ Test 1: Valid: Simple action
   Content: "Made banana bread today"
   Result: ALLOWED

❌ Test 6: Block: Phone number (dashes)
   Content: "Call me at 123-456-7890"
   Result: BLOCKED
   Reason: Phone numbers are not allowed for your safety
   Message: 📵 For your safety, please don't share phone numbers...

...

📊 Results: 27/27 tests passed
   ✅ Passed: 27
   ❌ Failed: 0
   Success Rate: 100%
```

---

## Edge Cases to Verify

### False Positives (Should PASS but might trigger)

1. **Numbers in context:**
   ```
   Watched a 10 minute video
   ```
   - Status: ✅ Should pass (not a phone number)

2. **Domain names in text:**
   ```
   Avoided my.problems.com
   ```
   - Status: ❌ May block (contains .com)
   - Acceptable: Rare edge case

3. **@ symbol in context:**
   ```
   Ate @ my favorite restaurant
   ```
   - Status: ❌ May block (contains @)
   - Acceptable: User can rephrase

4. **Platform names in context:**
   ```
   Didn't use instagram today
   ```
   - Status: ❌ Will block
   - Acceptable: Prevents workarounds

### Boundary Cases

5. **Exactly 3 characters:**
   ```
   abc
   ```
   - Status: ✅ Should pass (minimum length)

6. **Exactly 500 characters:**
   ```
   [Type exactly 500 characters]
   ```
   - Status: ✅ Should pass (maximum length)

7. **Whitespace only:**
   ```
   "   "
   ```
   - Status: ❌ Should block (empty after trim)

---

## Manual Verification Checklist

- [ ] Valid posts create successfully and show result page
- [ ] Phone number posts show friendly error with 📵 emoji
- [ ] Email posts show friendly error with 📧 emoji
- [ ] URL posts show friendly error with 🔗 emoji
- [ ] Social media posts show friendly error with 📱 emoji
- [ ] Explicit content posts show friendly error with 🚫 emoji
- [ ] Self-harm posts show helpful error with 💜 emoji and crisis line mention
- [ ] Spam posts show friendly error with ⛔ emoji
- [ ] Length errors show appropriate ✏️ or ✂️ emoji
- [ ] Error message is dismissable (X button works)
- [ ] Error clears when user submits valid content
- [ ] No error on creative/unconventional but appropriate posts

---

## Logging Verification

Check your terminal/console for these logs:

### Successful Post:
```
✅ Post created successfully from IP: [IP]
```

### Blocked Post:
```
🚫 Content blocked for IP [IP]: Phone numbers are not allowed for your safety
```

---

## Production Monitoring

Once deployed, monitor:

1. **Blocked content frequency** (are we blocking too much?)
2. **False positive reports** (users complaining about blocked content)
3. **Abuse patterns** (IP addresses repeatedly trying to bypass)
4. **Top violation categories** (what gets blocked most often)

Adjust rules quarterly based on data.

---

## Quick Reference: Expected Behavior

| Input Type | Action | HTTP Status | User Message |
|------------|--------|-------------|--------------|
| Valid post | Create | 201 | Navigate to result page |
| Phone | Block | 400 | "📵 For your safety..." |
| Email | Block | 400 | "📧 For your safety..." |
| URL | Block | 400 | "🔗 Links aren't allowed..." |
| Social handle | Block | 400 | "📱 Social media handles..." |
| Explicit | Block | 400 | "🚫 This content isn't appropriate..." |
| Self-harm | Block | 400 | "💜 We noticed concerning language..." |
| Spam | Block | 400 | "⛔ This looks like spam..." |
| Too short | Block | 400 | "✏️ Tell us a bit more..." |
| Too long | Block | 400 | "✂️ Keep it short and sweet..." |

---

**Last Updated:** January 2025  
**Test Coverage:** 27 test cases  
**Success Criteria:** All tests pass, no false negatives on safety rules

