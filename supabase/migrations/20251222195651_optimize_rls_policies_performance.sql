/*
  # Optimiser les performances des policies RLS

  1. Optimisation
    - Remplace auth.uid() par (select auth.uid()) dans toutes les policies
    - Empêche la réévaluation de auth.uid() pour chaque ligne
    - Améliore significativement les performances des requêtes à grande échelle

  2. Tables concernées
    - likes
    - blocked_users
    - post_reviews
    - messages
    - conversations
    - transactions
    - reviews
    - posts
    - profiles
    - wallet_balance
    - notifications
    - post_boosts
    - subscriptions

  3. Notes importantes
    - Cette optimisation est critique pour les performances à grande échelle
    - auth.uid() est évalué une seule fois par requête au lieu d'une fois par ligne
*/

-- LIKES
DROP POLICY IF EXISTS "Users can create likes" ON likes;
CREATE POLICY "Users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- BLOCKED_USERS
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;
CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can view their blocks" ON blocked_users;
CREATE POLICY "Users can view their blocks"
  ON blocked_users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

-- POST_REVIEWS
DROP POLICY IF EXISTS "Authenticated users can create post reviews" ON post_reviews;
CREATE POLICY "Authenticated users can create post reviews"
  ON post_reviews FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own post reviews" ON post_reviews;
CREATE POLICY "Users can delete their own post reviews"
  ON post_reviews FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own post reviews" ON post_reviews;
CREATE POLICY "Users can update their own post reviews"
  ON post_reviews FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- MESSAGES (garder les deux policies pour INSERT pour le moment, on corrigera après)
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid())::text = sender_id::text);

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id)
    )
  );

DROP POLICY IF EXISTS "Users can update message read status" ON messages;
CREATE POLICY "Users can update message read status"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id)
    )
  );

DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id)
    )
  );

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id);

DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id);

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user1_id OR (select auth.uid()) = user2_id);

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- REVIEWS
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = from_user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = from_user_id);

-- POSTS
DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- PROFILES
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- WALLET_BALANCE
DROP POLICY IF EXISTS "Users can update own balance" ON wallet_balance;
CREATE POLICY "Users can update own balance"
  ON wallet_balance FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own balance" ON wallet_balance;
CREATE POLICY "Users can view own balance"
  ON wallet_balance FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
CREATE POLICY "Users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = actor_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- POST_BOOSTS
DROP POLICY IF EXISTS "Users can create boosts" ON post_boosts;
CREATE POLICY "Users can create boosts"
  ON post_boosts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update city of own boosts" ON post_boosts;
CREATE POLICY "Users can update city of own boosts"
  ON post_boosts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own boosts" ON post_boosts;
CREATE POLICY "Users can view own boosts"
  ON post_boosts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = (select auth.uid())
    )
  );

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON subscriptions;
CREATE POLICY "Users can create their own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
