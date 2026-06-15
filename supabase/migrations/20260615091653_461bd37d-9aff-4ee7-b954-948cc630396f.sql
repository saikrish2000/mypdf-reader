CREATE POLICY "Users can only join their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'user:' || (auth.uid())::text || ':%')
);

CREATE POLICY "Users can only send to their own realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE 'user:' || (auth.uid())::text || ':%')
);