-- hecho por: Ana Aguirre Sanchez (es para mi commit lol)
-- paso 1: agregar el campo isActive a la tabla de alumnos (por defecto todos entran activos)
ALTER TABLE alumno ADD COLUMN isActive BOOLEAN DEFAULT true;

-- paso 2. crear la tabla intermedia para relacionar Alumnos con Materias
CREATE TABLE alumno_materia (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER REFERENCES alumno(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materia(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- regla obligatoria: evitar que se duplique la misma materia para el mismo alumno
    CONSTRAINT unique_alumno_materia UNIQUE(alumno_id, materia_id)
);