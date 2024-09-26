const db = require('../database/db');
const bcrypt = require('bcrypt');

// Crear estudiante
exports.agregarUsuario = async (req, res) => {
    const { nombre, apellido, fecha_nacimiento, gmail, id_clase, id_rol, estado, contraseña } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        const query = 'INSERT INTO usuarios (nombre, apellido, fecha_nacimiento, gmail, id_clase, id_rol, estado, contraseña) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [nombre, apellido, fecha_nacimiento, gmail, id_clase, id_rol, estado, hashedPassword], (err, results) => {
            if (err) {
                console.error('Error al crear usuario:', err);
                return res.status(400).json({ error: 'Error al crear usuario', details: err.message });
            }
            res.status(201).json({
                id_usuario: results.insertId,
                nombre,
                apellido,
                fecha_nacimiento,
                gmail,
                id_clase,
                id_rol,
                estado
            });
        });
    } catch (error) {
        console.error('Error al cifrar la contraseña:', error);
        res.status(500).json({ error: 'Error al cifrar la contraseña', details: error.message });
    }
};

exports.traer = async (req, res) => {
    const query = `
        SELECT 
            u.id_usuario,
            u.nombre,
            u.apellido,
            DATE_FORMAT(u.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
            u.gmail,
            u.id_clase,
            u.contraseña,
            u.id_rol,
            u.estado,
            r.nombre_rol,
            c.nombre_clase AS nombre_clase
        FROM 
            usuarios u
        LEFT JOIN 
            rol r ON u.id_rol = r.id_rol
        LEFT JOIN 
            clases c ON u.id_clase = c.id_clase
        WHERE 
            u.estado IN ('habilitado', 'espera', 'deshabilitado');
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener usuarios', details: err.message });
        }
        res.status(200).json(results);
    });
};


// Controlador para obtener los datos de un usuario específico
exports.obtenerUsuario = async (req, res) => {
    const usuarioId = req.params.id;

    try {
        // Suponiendo que usas una función de base de datos para hacer la consulta
        const query = 'SELECT * FROM usuarios WHERE id_usuario = ?';
        
        // Consulta a la base de datos
        db.query(query, [usuarioId], (err, results) => {
            if (err) {
                console.error('Error al consultar el usuario:', err);
                return res.status(500).json({ error: 'Error al consultar el usuario', details: err.message });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Enviar los datos del usuario como respuesta
            res.status(200).json(results[0]);
        });
    } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
};


// Leer un estudiante específico
exports.traer_id = async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM estudiantes WHERE id_usuario = ?';
    db.query(query, [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        res.status(200).json(results[0]);
    });
};

// Editar usuario
exports.editarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, fecha_nacimiento, gmail, estado } = req.body;

    // Validación de datos
    if (!nombre || !apellido || !fecha_nacimiento || !gmail || !estado) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const resultado = await db.query('UPDATE usuarios SET nombre = ?, apellido = ?, fecha_nacimiento = ?, gmail = ?, estado = ? WHERE id_usuario = ?', [nombre, apellido, fecha_nacimiento, gmail, estado, id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario editado exitosamente' });
    } catch (error) {
        console.error('Error al editar el usuario en la API:', error);
        res.status(500).json({ error: 'Error al editar el usuario' });
    }
};







exports.actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, fecha_nacimiento, gmail, id_clase, contraseña, id_rol, estado } = req.body;

    // Validar ID
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    let hashedPassword = null;
    if (contraseña) {
        try {
            hashedPassword = await bcrypt.hash(contraseña, 10);
        } catch (err) {
            console.error('Error al encriptar la contraseña:', err.message);
            return res.status(500).json({ error: 'Error al encriptar la contraseña' });
        }
    }

    const query = `
        UPDATE usuarios 
        SET nombre = ?, apellido = ?, fecha_nacimiento = ?, gmail = ?, id_clase = ?,
            id_rol = ?, estado = ? ${contraseña ? ', contraseña = ?' : ''}
        WHERE id_usuario = ?
    `;

    // Preparar los valores para la consulta
    const values = [nombre, apellido, fecha_nacimiento, gmail, id_clase, id_rol, estado];
    if (hashedPassword) {
        values.push(hashedPassword);
    }
    values.push(id); // ID del usuario al final

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err.message);
            return res.status(500).json({ error: 'Error al actualizar usuario', details: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json({
            id_usuario: id,
            nombre,
            apellido,
            fecha_nacimiento,
            gmail,
            id_clase,
            id_rol,
            estado
        });
    });
};



exports.eliminar = async (req, res) => {
    const { id } = req.params;

    // Validar que el ID sea un número positivo
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    const query = 'DELETE FROM usuarios WHERE id_usuario = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar estudiante' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        res.status(204).send(); // No Content
    });
};





exports.traerEspera = async (req, res) => {
    const query = `
        SELECT 
            u.id_usuario,
            u.nombre,
            u.apellido,
            DATE_FORMAT(u.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
            u.gmail,
            u.id_clase,
            u.contraseña,
            u.id_rol,
            u.estado,
            r.nombre_rol,
            c.nombre_clase AS nombre_clase
        FROM 
            usuarios u
        LEFT JOIN 
            rol r ON u.id_rol = r.id_rol
        LEFT JOIN 
            clases c ON u.id_clase = c.id_clase
        WHERE 
            u.estado = 'espera';
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener usuarios', details: err.message });
        }
        res.status(200).json(results);
    });
};
