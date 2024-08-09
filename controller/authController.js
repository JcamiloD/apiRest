
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')
const db = require('../database/db');




exports.register = async (req, res) => {
    const saltRounds = 10;
    const { nombre, apellido, gmail, contraseña, fecha_nacimiento, id_clase } = req.body;

    try {
        const checkQuery = 'SELECT * FROM usuarios WHERE gmail = ?';
        db.query(checkQuery, [gmail], async (err, results) => {
            if (err) {
                console.error('Error al verificar el correo electrónico:');
                return res.status(500).json({ message: 'Error al verificar el correo electrónico', error: err });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
            }
            const hashedPassword = await bcryptjs.hash(contraseña, saltRounds);

            const idRol = 1;
            const estado = 'espera';

            const insertQuery = 'INSERT INTO usuarios (nombre, apellido, gmail, fecha_nacimiento, id_clase, contraseña, id_rol, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(insertQuery, [nombre, apellido, gmail, fecha_nacimiento, id_clase, hashedPassword, idRol, estado], (err, result) => {
                if (err) {
                    console.error('Error al insertar usuario en la base de datos:', err);
                    return res.status(500).json({ message: 'Error al registrar usuario', error: err });
                }else{
                    res.status(201).json({ message: 'Usuario registrado exitosamente', userId: result.insertId });
                }
            });
        });
    } catch (error) {
        console.error('Error al encriptar la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error });
    }
};



exports.login = async (req, res) => {
    try {
        const { gmail, pass } = req.body;

        if (!gmail || !pass) {
            return res.status(400).json({ message: 'Ingresa Datos en los campos' });
        }

        db.query('SELECT * FROM usuarios WHERE gmail = ?', [gmail], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Error en el servidor' });
            }

            if (results.length === 0 || !(await bcryptjs.compare(pass, results[0].contraseña))) {
                return res.status(401).json({ message: 'La contraseña y/o el Gmail no coinciden' });
            }

            const user = results[0];
            
            // Verificar el estado del usuario
            if (user.estado === 'deshabilitado') {
                return res.status(403).json({ message: 'Tu cuenta está deshabilitada' });
            }
            if (user.estado === 'espera') {
                return res.status(403).json({ message: 'Tu cuenta está en espera' });
            }

            // Obtener el rol desde la tabla correspondiente
            db.query('SELECT nombre_rol FROM rol WHERE id_rol = ?', [user.id_rol], (error, roleResults) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: 'Error en el servidor' });
                }

                if (roleResults.length === 0) {
                    return res.status(500).json({ message: 'Rol no encontrado' });
                }

                const rol = roleResults[0].nombre_rol;

                const token = jwt.sign({ id: user.id_usuario, rol }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES
                });

                res.cookie('jwt', token, {
                    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
                    httpOnly: true
                });

                return res.status(200).json({ message: 'Login exitoso', token });
            });
        });
    } catch (error) {
        console.log('Error en el proceso de login:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};




exports.get_role = (req, res) => {
    const { id } = req.body;
    db.query(`
        SELECT r.nombre_rol
        FROM rol r
        INNER JOIN usuarios u ON r.id_rol = u.id_rol
        WHERE u.id_usuario = ?
    `, [id], (error, results) => {
        if (error) {
            console.error('Error en la consulta SQL:', error);
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        res.json({ rol: results[0].nombre_rol });
    });
};





exports.verify = (req, res) => {
    const { id } = req.body;

    db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ usuario: results[0] });
    });
};
