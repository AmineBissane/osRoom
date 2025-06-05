-- Añadir columnas para calificación
ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS grade DOUBLE PRECISION;
ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP;
ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS graded_by VARCHAR(255);
ALTER TABLE activities_responses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; 