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
                DATE_FORMAT(a.fecha_asistencia, '%Y-%m-%d') AS fecha_asistencia,
                a.hora_asistencia,
                IF(a.asistencia_confirmada = 1, 'Sí', 'No') AS asistencia_confirmada
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
exports.obtenerEstudiantesPorClase = (req, res) => {
    const { id_clase } = req.params;  // Obtenemos el id_clase de los parámetros de la ruta

    const query = `
        SELECT 
            u.id_usuario,
            u.nombre,
            u.apellido,
            u.gmail,
            c.nombre_clase
        FROM usuarios u
        JOIN clases c ON u.id_clase = c.id_clase
        WHERE c.id_clase = ? 
          AND u.estado = 'habilitado'  -- Filtrar solo usuarios habilitados
          AND u.id_rol = 1;           -- Filtrar solo usuarios con rol de estudiante
    `;

    db.query(query, [id_clase], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los estudiantes', details: err.message });
        }
        res.status(200).json(results);
    });
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


//Camilo
exports.agregarAsistencia = (req, res) => {
    const { id_clase, id_usuario, fecha_asistencia, hora_asistencia, asistencia_confirmada } = req.body;

    // Verificar si todos los campos obligatorios están presentes
    if (!id_clase || !id_usuario || !fecha_asistencia || !hora_asistencia || (asistencia_confirmada !== 0 && asistencia_confirmada !== 1)) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Consulta SQL para insertar una nueva asistencia
    const query = `
        INSERT INTO asistencias (id_clase, id_usuario, fecha_asistencia, hora_asistencia, asistencia_confirmada)
        VALUES (?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta
    db.query(query, [id_clase, id_usuario, fecha_asistencia, hora_asistencia, asistencia_confirmada], (err, result) => {
        if (err) {
            console.error('Error al agregar la asistencia:', err);
            return res.status(500).json({ message: 'Error al agregar la asistencia' });
        }

        return res.status(201).json({ message: 'Asistencia agregada exitosamente' });
    });
};


exports.eliminarAsistencia = (req, res) => {
    const { id } = req.params; // Obtenemos el id de la asistencia desde los parámetros de la solicitud

    // Consulta SQL para eliminar la asistencia de la base de datos
    const query = 'DELETE FROM asistencias WHERE id_asistencia = ?';

    // Ejecución de la consulta
    db.query(query, [id], (error, result) => {
        if (error) {
            console.error('Error al eliminar la asistencia:', error);
            return res.status(500).json({ message: 'Error del servidor' });
        }

        // Verificamos si alguna fila fue afectada (si se eliminó una asistencia)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Asistencia no encontrada' });
        }

        // Si la eliminación fue exitosa, enviamos la respuesta adecuada
        res.status(200).json({ message: 'Asistencia eliminada correctamente' });
    });
};



exports.actualizarAsistencia = (req, res) => {
    const id_asistencia = parseInt(req.params.id);  // Asegúrate de obtener el ID de los parámetros de la URL
    const { fecha_asistencia, hora_asistencia, asistencia_confirmada } = req.body;

    // Verificar si todos los campos obligatorios están presentes
    if (!fecha_asistencia || !hora_asistencia || (asistencia_confirmada !== 0 && asistencia_confirmada !== 1)) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Consulta SQL para actualizar solo los campos deseados
    const query = `
        UPDATE asistencias 
        SET fecha_asistencia = ?, hora_asistencia = ?, asistencia_confirmada = ?
        WHERE id_asistencia = ?`;

    // Ejecutar la consulta
    db.query(query, [fecha_asistencia, hora_asistencia, asistencia_confirmada, id_asistencia], (err, result) => {
        if (err) {
            console.error('Error al actualizar la asistencia:', err);
            return res.status(500).json({ message: 'Error al actualizar la asistencia' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Asistencia no encontrada' });
        }

        return res.status(200).json({ message: 'Asistencia actualizada exitosamente' });
    });
};



//solo boxeo
exports.soloboxeo = (req, res) => {
    try {
        // Consulta SQL con JOIN y filtro por clase, con formato de fecha
        const query = `
            SELECT 
                a.id_asistencia,
                CONCAT(u.nombre, ' ', u.apellido) AS nombre_usuario,
                c.nombre_clase AS clase_asistencia,
                DATE_FORMAT(a.fecha_asistencia, '%Y-%m-%d') AS fecha_asistencia,
                a.hora_asistencia,
                IF(a.asistencia_confirmada = 1, 'Sí', 'No') AS asistencia_confirmada
            FROM asistencias a
            JOIN usuarios u ON a.id_usuario = u.id_usuario
            JOIN clases c ON a.id_clase = c.id_clase
            WHERE c.nombre_clase = 'boxeo';
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



exports.obtenerAsistenciaParkour = (req, res) => {
    try {
        // Consulta SQL para obtener asistencias solo para 'parkour'
        const query = `
            SELECT 
                a.id_asistencia,
                CONCAT(u.nombre, ' ', u.apellido) AS nombre_usuario,
                c.nombre_clase AS clase_asistencia,
                DATE_FORMAT(a.fecha_asistencia, '%Y-%m-%d') AS fecha_asistencia,
                a.hora_asistencia,
                IF(a.asistencia_confirmada = 1, 'Sí', 'No') AS asistencia_confirmada
            FROM asistencias a
            JOIN usuarios u ON a.id_usuario = u.id_usuario
            JOIN clases c ON a.id_clase = c.id_clase
            WHERE c.nombre_clase = 'parkour';
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


// En tu archivo de controlador (por ejemplo, `controllers/asistenciasController.js`)
exports.obtenerAsistenciaMixtas = (req, res) => {
    try {
        // Consulta SQL para obtener asistencias solo para 'mixtas'
        const query = `
            SELECT 
                a.id_asistencia,
                CONCAT(u.nombre, ' ', u.apellido) AS nombre_usuario,
                c.nombre_clase AS clase_asistencia,
                DATE_FORMAT(a.fecha_asistencia, '%Y-%m-%d') AS fecha_asistencia,
                a.hora_asistencia,
                IF(a.asistencia_confirmada = 1, 'Sí', 'No') AS asistencia_confirmada
            FROM asistencias a
            JOIN usuarios u ON a.id_usuario = u.id_usuario
            JOIN clases c ON a.id_clase = c.id_clase
            WHERE c.nombre_clase = 'mixtas';
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
