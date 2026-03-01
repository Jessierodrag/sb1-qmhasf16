-- Indexes pour améliorer les performances des requêtes

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(location) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_boosted ON posts(is_boosted) WHERE is_boosted = true AND is_active = true;

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, sender_id) WHERE is_read = false;

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);

-- Likes
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_to_user ON reviews(to_user_id);
