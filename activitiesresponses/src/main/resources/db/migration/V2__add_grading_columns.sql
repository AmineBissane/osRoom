-- Añadir columnas para calificación
-- Try first table name (Entity name converted to snake_case)
DO $$
BEGIN
    -- Check if activities_responses table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities_responses') THEN
        ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS grade DOUBLE PRECISION;
        ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP;
        ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS graded_by VARCHAR(255);
        ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS graded_by_uuid VARCHAR(255);
        ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    -- Check if activitiesresponses table exists (no snake_case conversion)
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activitiesresponses') THEN
        ALTER TABLE activitiesresponses ADD COLUMN IF NOT EXISTS grade DOUBLE PRECISION;
        ALTER TABLE activitiesresponses ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP;
        ALTER TABLE activitiesresponses ADD COLUMN IF NOT EXISTS graded_by VARCHAR(255);
        ALTER TABLE activitiesresponses ADD COLUMN IF NOT EXISTS graded_by_uuid VARCHAR(255);
        ALTER TABLE activitiesresponses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    -- Check if activity_response table exists (from comment in code)
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_response') THEN
        ALTER TABLE activity_response ADD COLUMN IF NOT EXISTS grade DOUBLE PRECISION;
        ALTER TABLE activity_response ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP;
        ALTER TABLE activity_response ADD COLUMN IF NOT EXISTS graded_by VARCHAR(255);
        ALTER TABLE activity_response ADD COLUMN IF NOT EXISTS graded_by_uuid VARCHAR(255);
        ALTER TABLE activity_response ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ELSE
        RAISE EXCEPTION 'Cannot find the activities responses table';
    END IF;
END
$$; 