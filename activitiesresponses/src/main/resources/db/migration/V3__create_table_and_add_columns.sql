-- Create the activities_responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS activities_responses (
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

-- Add the grading columns if they don't exist
ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS grade DOUBLE PRECISION;
ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP;
ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS graded_by VARCHAR(255);
ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS graded_by_uuid VARCHAR(255); 