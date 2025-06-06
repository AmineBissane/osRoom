-- Baseline migration
-- This is the initial table structure for the activities_responses table

-- Drop the table if it exists to ensure a clean start
DROP TABLE IF EXISTS activities_responses;

-- Create the table with all necessary columns
CREATE TABLE activities_responses (
    id SERIAL PRIMARY KEY,
    activity_id BIGINT,
    file_id VARCHAR(255),
    student_id BIGINT,
    student_name VARCHAR(255),
    final_note DOUBLE PRECISION,
    response_file_id VARCHAR(255),
    creator_id VARCHAR(255),
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 