-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'video')),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  is_delivered BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER
);

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_type VARCHAR(10) NOT NULL CHECK (call_type IN ('audio', 'video')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'missed', 'rejected')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER -- in seconds
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_participants ON calls(caller_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online);

-- Create a function to update last_seen automatically
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_seen when is_online changes
CREATE TRIGGER update_user_last_seen
  BEFORE UPDATE OF is_online ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Users can read their own data and other users' public data
CREATE POLICY "Users can view all users" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Messages policies - users can only see messages they sent or received
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT
  USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = receiver_id::text
  );

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update their sent messages" ON messages
  FOR UPDATE
  USING (auth.uid()::text = sender_id::text);

-- Calls policies - users can only see calls they participated in
CREATE POLICY "Users can view their calls" ON calls
  FOR SELECT
  USING (
    auth.uid()::text = caller_id::text OR 
    auth.uid()::text = receiver_id::text
  );

CREATE POLICY "Users can insert their own calls" ON calls
  FOR INSERT
  WITH CHECK (auth.uid()::text = caller_id::text);

CREATE POLICY "Users can update their calls" ON calls
  FOR UPDATE
  USING (
    auth.uid()::text = caller_id::text OR 
    auth.uid()::text = receiver_id::text
  ); 