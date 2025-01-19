-- Add is_deleted column to plants table to mark deleted plants
ALTER TABLE plants ADD COLUMN is_deleted TINYINT(1) DEFAULT 0;
