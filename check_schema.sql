-- Check if activity_embeddings column exists and its type
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('activities', 'activity_count', 'activity_embeddings');
