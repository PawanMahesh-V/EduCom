-- Add delivery and read timestamp columns to messages table
-- WhatsApp-style message status tracking

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Create index for faster queries on delivery status
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at ON messages(delivered_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Update read_at for already read messages
UPDATE messages 
SET read_at = created_at 
WHERE is_read = true AND read_at IS NULL;
