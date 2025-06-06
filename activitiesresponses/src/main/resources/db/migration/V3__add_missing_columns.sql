-- Add grading columns to the existing table
DO $$
BEGIN
    -- Check if the grade column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'activities_responses' AND column_name = 'grade'
    ) THEN
        ALTER TABLE activities_responses ADD COLUMN grade DOUBLE PRECISION;
    END IF;
    
    -- Check if the graded_at column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'activities_responses' AND column_name = 'graded_at'
    ) THEN
        ALTER TABLE activities_responses ADD COLUMN graded_at TIMESTAMP;
    END IF;
    
    -- Check if the graded_by column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'activities_responses' AND column_name = 'graded_by'
    ) THEN
        ALTER TABLE activities_responses ADD COLUMN graded_by VARCHAR(255);
    END IF;
    
    -- Check if the graded_by_uuid column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'activities_responses' AND column_name = 'graded_by_uuid'
    ) THEN
        ALTER TABLE activities_responses ADD COLUMN graded_by_uuid VARCHAR(255);
    END IF;
END $$; 