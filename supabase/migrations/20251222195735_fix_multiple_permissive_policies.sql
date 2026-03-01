/*
  # Corriger les policies permissives multiples

  1. Messages INSERT
    - Fusion de "Users can send messages" et "Users can send messages in their conversations"
    - Utilise une seule policy avec une condition combinée

  2. Post_boosts SELECT
    - Fusion de "Public can check active boosts" et "Users can view own boosts"
    - Utilise une seule policy avec une condition combinée

  3. Notes importantes
    - Plusieurs policies permissives sur la même action peuvent causer des problèmes de performance
    - Une seule policy avec des conditions OR est plus efficace
*/

-- MESSAGES: Fusionner les deux policies INSERT
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

CREATE POLICY "Users can send messages in conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid())::text = sender_id::text
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id)
    )
  );

-- POST_BOOSTS: Fusionner les deux policies SELECT
DROP POLICY IF EXISTS "Public can check active boosts" ON post_boosts;
DROP POLICY IF EXISTS "Users can view own boosts" ON post_boosts;

CREATE POLICY "Users can view boosts"
  ON post_boosts FOR SELECT
  TO authenticated
  USING (
    (is_active = true AND end_date > NOW())
    OR EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = (select auth.uid())
    )
  );
