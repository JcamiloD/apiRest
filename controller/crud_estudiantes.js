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
            u.estado = 'habilitado';
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

exports.editarUsuario = async (req, res, next) => {
    try {
        const usuarioId = req.params.id;
        const usuarioActualizado = {
            nombre: req.body.nombre,
            apellido: req.body.apellido,
            fecha_nacimiento: req.body.fecha_nacimiento,
            gmail: req.body.gmail,
            id_clase: req.body.id_clase,
            id_rol: req.body.id_rol,
            estado: req.body.estado,
            contraseña: req.body.contraseña // Si se desea cambiar la contraseña
        };

        const response = await fetch(`http://localhost:4000/api/actualizar/${usuarioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuarioActualizado)
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}, Response: ${await response.text()}`);
        }

        const data = await response.json();
        console.log('Datos actualizados del servidor:', data);

        res.locals.data = data;
        next();
    } catch (error) {
        console.error('Error al editar usuario:', error);
        res.status(500).send('Error interno del servidor');
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



exports.actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, fecha_nacimiento, gmail, id_clase, contraseña, id_rol, estado } = req.body;

    // Validar que id sea un número positivo
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    // Encriptar la contraseña si se proporciona
    let hashedPassword = null;
    if (contraseña) {
        try {
            hashedPassword = await bcrypt.hash(contraseña, 10);
        } catch (err) {
            console.error('Error al encriptar la contraseña:', err);
            return res.status(500).json({ error: 'Error interno del servidor al encriptar la contraseña' });
        }
    }

    // Consulta SQL para actualizar los campos del usuario
    const query = `
        UPDATE usuarios 
        SET nombre = ?, apellido = ?, fecha_nacimiento = ?, gmail = ?, id_clase = ?, 
            ${contraseña ? 'contraseña = ?,' : ''}
            id_rol = ?, estado = ?
        WHERE id_usuario = ?
    `;

    // Crear un array con los valores para la consulta SQL
    const values = [nombre, apellido, fecha_nacimiento, gmail, id_clase];
    if (hashedPassword) values.push(hashedPassword); // Añadir la contraseña encriptada si está presente
    values.push(id_rol, estado, id);

    // Ejecutar la consulta
    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err); // Agregar un log para depuración
            return res.status(400).json({ error: 'Error al actualizar estudiante' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
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
