const db = require('../database/db');
const bcrypt = require('bcrypt');

exports.obtenerAsistencia = (req, res) => {
    try {
        // Consulta SQL con JOIN
        const query = `
            SELECT 
                a.id_asistencia,
                CONCAT(u.nombre, ' ', u.apellido) AS nombre_usuario,
                c.nombre_clase AS clase_asistencia,
                a.fecha_asistencia,
                a.hora_asistencia
            FROM asistencias a
            JOIN usuarios u ON a.id_usuario = u.id_usuario
            JOIN clases c ON a.id_clase = c.id_clase;
                    `;
        
        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener asistencias', details: err.message });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: error.message });
    }
};


// Crear asistencia
exports.agregarAsistencia = async (req, res) => {
    const { clase, instructor, fecha, hora } = req.body;

    try {
        // Consulta SQL para insertar la asistencia en la base de datos
        const query = 'INSERT INTO asistencias (id_clase, id_usuario, fecha_asistencia, hora_asistencia) VALUES (?, ?, ?, ?)';
        db.query(query, [clase, instructor, fecha, hora], (err, results) => {
            if (err) {
                console.error('Error al registrar asistencia:', err);
                return res.status(400).json({ error: 'Error al registrar asistencia', details: err.message });
            }
            // Enviar respuesta incluyendo el ID de la nueva asistencia
            res.status(201).json({
                success: true,
                id_asistencia: results.insertId, // Asegúrate de incluir este campo
                message: 'Asistencia registrada con éxito' // Agregar mensaje de éxito
            });
        });
    } catch (error) {
        console.error('Error al registrar asistencia:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};


// Obtener estudiantes
exports.obtenerEstudiantes = (req, res) => {
    try {
        const query = 'SELECT * FROM usuarios WHERE id_rol = 1';
        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener usuarios', details: err.message });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: error.message });
    }
};

exports.actualizarAsistencia = (req, res) => {
    const { id_asistencia, estudiantes } = req.body;

    // Verificar que el ID de asistencia existe
    db.query('SELECT id_asistencia FROM asistencias WHERE id_asistencia = ?', [id_asistencia], (err, result) => {
        if (err) {
            console.error('Error al verificar asistencia:', err.message);
            return res.status(500).json({ error: 'Error al verificar asistencia', details: err.message });
        }

        if (result.length === 0) {
            console.error('ID de asistencia no encontrado:', id_asistencia);
            return res.status(400).json({ error: 'ID de asistencia no encontrado' });
        }

        // Insertar estudiantes
        db.beginTransaction(err => {
            if (err) {
                console.error('Error al iniciar la transacción:', err.message);
                return res.status(500).json({ error: 'Error al iniciar la transacción', details: err.message });
            }

            const insertQuery = 'INSERT INTO asistencia_estudiante (id_asistencia, id_usuario) VALUES (?, ?)';
            const estudiantesPromises = estudiantes.map(estudianteId => {
                return new Promise((resolve, reject) => {
                    db.query(insertQuery, [id_asistencia, estudianteId], (err, result) => {
                        if (err) {
                            console.error('Error al insertar estudiante:', err.message);
                            return reject(err);
                        }
                        resolve();
                    });
                });
            });

            Promise.all(estudiantesPromises)
                .then(() => {
                    db.commit(err => {
                        if (err) {
                            console.error('Error al confirmar la transacción:', err.message);
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error al confirmar la transacción', details: err.message });
                            });
                        }
                        res.json({ message: 'Asistencia actualizada exitosamente' });
                    });
                })
                .catch(err => {
                    console.error('Error al insertar estudiantes:', err.message);
                    db.rollback(() => {
                        res.status(500).json({ error: 'Error al insertar estudiantes', details: err.message });
                    });
                });
        });
    });
};

