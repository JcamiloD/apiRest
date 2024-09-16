
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')
const db = require('../database/db');

const nodemailer = require('nodemailer');
const crypto = require('crypto');




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

        // Verificar si el usuario existe y validar la contraseña
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
            }if (user.estado != 'habilitado' & user.estado !='deshabilitado' & user.estado != 'espera' ) {
                return res.status(403).json({ message: 'Se desconoce tu estado0000000' });
            }
            

            // Obtener el rol, permisos y la clase asociada
            db.query(`
                SELECT rol.nombre_rol, permisos.nombre_permiso, clases.nombre_clase 
                FROM rol 
                INNER JOIN permisos_rol ON rol.id_rol = permisos_rol.id_rol 
                INNER JOIN permisos ON permisos_rol.id_permiso = permisos.id_permiso
                LEFT JOIN clases ON clases.id_clase = ?
                WHERE rol.id_rol = ?
            `, [user.id_clase, user.id_rol], (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: 'Error en el servidor' });
                }

                if (results.length === 0) {
                    return res.status(500).json({ message: 'Rol no encontrado, clase no encontrada o no tiene permisos asignados' });
                }

                // Extraer el rol, los permisos y la clase
                const rol = results[0].nombre_rol;

                const clase = results[0].nombre_clase;

                // Crear el token con rol, permisos y clase
                const token = jwt.sign({ id: user.id_usuario, rol, clase }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES
                });

                // Guardar el token en la cookie
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



exports.get_permissions = (req, res) => {
    const { id } = req.body;
    db.query(`
        SELECT p.nombre_permiso
        FROM permisos p
        INNER JOIN permisos_rol rp ON p.id_permiso = rp.id_permiso
        INNER JOIN usuarios u ON rp.id_rol = u.id_rol
        WHERE u.id_usuario = ?
    `, [id], (error, results) => {
        if (error) {
            console.error('Error en la consulta SQL:', error);
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Permisos no encontrados' });
        }

        // Convertir los resultados en un array de permisos
        const permisos = results.map(row => row.nombre_permiso);
        res.json({ permisos });
    });
};


exports.enviarCodigo = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Email recibido:', email);

        // Consultar el usuario por correo
        db.query('SELECT * FROM usuarios WHERE gmail = ?', [email], async (err, results) => {
            if (err) {
                console.error('Error al consultar el usuario:', err);
                return res.status(500).json({ message: 'Error al consultar el usuario.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'El correo no está registrado.' });
            }

            const usuario = results[0];
            const codigoRecuperacion = crypto.randomBytes(3).toString('hex');
            const codigoExpiracion = Date.now() + 3600000; // 1 hora
            console.log('Código de recuperación generado:', codigoRecuperacion);

            // Actualizar el código de recuperación y la expiración
            db.query('UPDATE usuarios SET codigoRecuperacion = ?, codigoExpiracion = ? WHERE id_usuario = ?', 
                [codigoRecuperacion, codigoExpiracion, usuario.id_usuario], async (err) => {
                if (err) {
                    console.error('Error al actualizar el código de recuperación:', err);
                    return res.status(500).json({ message: 'Error al actualizar el código de recuperación.' });
                }

                // Configuración de Nodemailer
                const transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: usuario.gmail,
                    subject: 'Código de Recuperación de Contraseña',
                    text: `Tu código de recuperación es: ${codigoRecuperacion}`
                };

                try {
                    await transporter.sendMail(mailOptions);
                    res.status(200).json({ message: 'Código de recuperación enviado.' });
                } catch (error) {
                    console.error('Error al enviar el correo:', error);
                    res.status(500).json({ message: 'Error al enviar el código de recuperación.' });
                }
            });
        });
    } catch (error) {
        console.error('Error general:', error);
        res.status(500).json({ message: 'Error al enviar el código de recuperación.' });
    }
};

exports.restablecerContraseña = async (req, res, next) => {
    const saltRounds = 10;
    try {
        const { codigo, nuevaContraseña } = req.body;

        if (!codigo || !nuevaContraseña) {
            return res.status(400).json({ message: 'El código y la nueva contraseña son requeridos.' });
        }

        // Verificar el código de recuperación
        db.query('SELECT * FROM usuarios WHERE codigoRecuperacion = ?', [codigo], async (error, results) => {
            if (error) {
                console.error('Error en la consulta SQL:', error);
                return res.status(500).json({ message: 'Error en la base de datos.' });
            }

            if (results.length > 0) {
                const usuario = results[0];
                const codigoExpiracion = usuario.codigoExpiracion;

                if (Date.now() > codigoExpiracion) {
                    // Código ha expirado
                    return res.status(400).json({ message: 'El código ha expirado.' });
                }

                // Aquí puedes agregar la lógica para encriptar la nueva contraseña
                const contraseñaEncriptada = await bcryptjs.hash(nuevaContraseña, saltRounds);

                // Actualizar la contraseña en la base de datos
                db.query('UPDATE usuarios SET contraseña = ?, codigoRecuperacion = NULL, codigoExpiracion = NULL WHERE codigoRecuperacion = ?', [contraseñaEncriptada, codigo], (error) => {
                    if (error) {
                        console.error('Error al actualizar la contraseña:', error);
                        return res.status(500).json({ message: 'Error al actualizar la contraseña.' });
                    }

                    res.status(200).json({ message: 'Contraseña restablecida con éxito.' });
                });
            } else {
                res.status(400).json({ message: 'Código incorrecto.' });
            }
        });
    } catch (error) {
        console.error('Error en el restablecimiento de la contraseña:', error);
        res.status(500).json({ message: 'Error en el restablecimiento de la contraseña.' });
    }
};