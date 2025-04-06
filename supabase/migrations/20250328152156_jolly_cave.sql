CREATE OR REPLACE FUNCTION increment_upvotes(answer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE answers
  SET upvotes = upvotes + 1
  WHERE id = answer_id;

  -- Check if answer has reached 5 upvotes
  WITH updated_answer AS (
    SELECT a.user_id, a.upvotes
    FROM answers a
    WHERE a.id = answer_id
  )
  UPDATE users u
  SET points = points + 5
  FROM updated_answer ua
  WHERE u.id = ua.user_id
    AND ua.upvotes = 5;
END;
$$;