-- Migration: Add status fields to outlets for crowdsourced wait times
ALTER TABLE outlets 
ADD COLUMN current_status ENUM('FAST', 'MODERATE', 'BUSY') DEFAULT 'FAST',
ADD COLUMN status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
