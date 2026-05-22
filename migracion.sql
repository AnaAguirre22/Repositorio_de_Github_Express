-- Script base para preparar la BD en nuestras compus

-- PASO 1: Le agregamos la columna isActive a la tabla alumno para poder hacer la eliminacion logica. 
-- Le ponemos DEFAULT true para que al registrar a alguien, ya este activo sin tener que mandarlo en el JSON.
ALTER TABLE alumno ADD COLUMN isActive BOOLEAN DEFAULT true;

-- PASO 2: Creamos la tabla intermedia. Esta es la que une a los alumnos con las materias que agarraron.
CREATE TABLE alumno_materia (
    id SERIAL PRIMARY KEY,
    -- El ON DELETE CASCADE sirve por si borramos un alumno físicamente, se borren sus inscripciones tambien
    alumno_id INTEGER REFERENCES alumno(id) ON DELETE CASCADE,
    materia_id INTEGER REFERENCES materia(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Esta restricción evita que un alumno se inscriba dos veces a la misma materia
    CONSTRAINT unique_alumno_materia UNIQUE(alumno_id, materia_id)
);