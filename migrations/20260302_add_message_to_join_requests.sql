ALTER TABLE prode_group_join_requests
ADD COLUMN message TEXT NULL,
ADD CONSTRAINT message_length_check
  CHECK (message IS NULL OR char_length(message) <= 300);
