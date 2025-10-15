# Day Summary Schema Fix Instructions

## Problem
`vector[]` (array of vectors) is not a standard type in pgvector.

## Solution
Use JSONB to store activity embeddings instead.

## Steps to Fix:

1. **Run the fixed schema in Supabase SQL Editor:**
   - Open: `supabase/day-summary-schema-fixed.sql`
   - This will:
     - Drop the old `activity_embeddings` column
     - Recreate it as JSONB
     - Add proper indexes

2. **Truncate posts table:**
   ```sql
   TRUNCATE TABLE posts RESTART IDENTITY CASCADE;
   ```

3. **Test again:**
   - The code is now updated to use JSONB format
   - First post should create successfully
   - Second similar post should match correctly

## Why JSONB?
- ✅ Native PostgreSQL type
- ✅ Automatic serialization/deserialization
- ✅ No complex string formatting needed
- ✅ Indexable with GIN indexes
- ✅ Works perfectly with Supabase client
