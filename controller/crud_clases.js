const db = require('../database/db');
const bcrypt = require('bcrypt');

// Traer todas las clases
exports.traer = async (req, res) => {
    const query = `
        SELECT 
            c.id_clase,
            c.nombre_clase,
            c.descripcion,
            c.tipo_clase,
            c.id_horario,  -- Agregado para traer el id_horario
            h.dias AS dias_clase,
            h.hora_inicio AS inicio_clase,
            h.hora_final AS final_clase
        FROM 
            clases c
        LEFT JOIN 
            horarios h ON c.id_horario = h.id_horario
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener clases', details: err.message });
        }
        res.status(200).json(results);
    });
};


// Obtener una clase por ID
exports.obtenerClase = async (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT 
            c.id_clase,
            c.nombre_clase,
            c.descripcion,
            c.tipo_clase,
            h.dias AS dias_clase,
            h.hora_inicio AS inicio_clase,
            h.hora_final AS final_clase
        FROM 
            clases c
        LEFT JOIN 
            horarios h ON c.id_horario = h.id_horario
        WHERE c.id_clase = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener la clase', details: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Clase no encontrada' });
        }
        res.status(200).json(results[0]);
    });
};

// Agregar una nueva clase
exports.agregarClase = async (req, res) => {
    const { nombre_clase, descripcion, tipo_clase, id_horario } = req.body;
    const query = `
        INSERT INTO clases (nombre_clase, descripcion, tipo_clase, id_horario)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [nombre_clase, descripcion, tipo_clase, id_horario], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al agregar la clase', details: err.message });
        }
        res.status(201).json({ message: 'Clase agregada exitosamente', id_clase: result.insertId });
    });
};

// Actualizar una clase
exports.actualizarClase = async (req, res) => {
    const { id } = req.params; // Obtener el ID de los parámetros de la solicitud
    const { nombre_clase, descripcion, tipo_clase, horario_clase, inicio_clase, final_clase } = req.body;

    const query = `
        UPDATE clases 
        SET 
            nombre_clase = ?, 
            descripcion = ?, 
            tipo_clase = ?, 
            id_horario = ?  -- Asegúrate de que este campo corresponde correctamente
        WHERE id_clase = ?
    `;

    // Asegúrate de que `horario_clase` sea un ID válido de la tabla `horarios`
    db.query(query, [nombre_clase, descripcion, tipo_clase, horario_clase, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar la clase', details: err.message });
        }
        res.status(200).json({ success: true, message: 'Clase actualizada exitosamente' });
    });
};

// Eliminar una clase
exports.eliminarClase = async (req, res) => {
    const { id } = req.params;
    console.log(req.params)
    const query = 'DELETE FROM clases WHERE id_clase = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            // Manejo de error de base de datos
            return res.status(500).json({ error: 'Error al eliminar la clase', details: err.message });
        }
        if (result.affectedRows === 0) {
            // Si no se afectaron filas, significa que la clase no fue encontrada
            return res.status(404).json({ error: 'Clase no encontrada' });
        }
        // Respuesta exitosa
        res.status(200).json({ message: 'Clase eliminada exitosamente' });
    });
};

