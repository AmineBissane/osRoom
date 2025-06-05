-- Create databases if they don't exist
CREATE DATABASE IF NOT EXISTS keycloak;
CREATE DATABASE IF NOT EXISTS gestion_nap;

-- Connect to the gestion_nap database and create schema
\c gestion_nap;

-- Create the notificaciones table if it doesn't exist
CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255),
    contenido TEXT,
    tipo VARCHAR(50),
    fecha_creacion TIMESTAMP,
    fecha_lectura TIMESTAMP,
    leida BOOLEAN DEFAULT FALSE,
    autor_id VARCHAR(255),
    autor_nombre VARCHAR(255),
    usuario_destinatario_id VARCHAR(255),
    destinatario_id VARCHAR(255),
    entidad_relacionada_id BIGINT,
    tipo_entidad_relacionada VARCHAR(50),
    mensaje TEXT,
    url_redireccion VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario_id ON notificaciones(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_destinatario_id ON notificaciones(usuario_destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha_creacion ON notificaciones(fecha_creacion);

-- Otorgar todos los privilegios al usuario alibou
GRANT ALL PRIVILEGES ON DATABASE gestion_nap TO alibou;
GRANT ALL PRIVILEGES ON SCHEMA public TO alibou; 