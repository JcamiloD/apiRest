const db = require('../database/db');
const bcrypt = require('bcrypt');

exports.obtenerPerfil = async (req, res) => {
    const id_usuario = req.query.id; // Obtén el id_usuario de los parámetros de la consulta

    // Realiza la consulta uniendo la tabla `usuarios` y `clases`
    const query = `
        SELECT u.*, c.nombre_clase
        FROM usuarios u
        LEFT JOIN clases c ON u.id_clase = c.id_clase
        WHERE u.id_usuario = ?
    `;

    db.query(query, [id_usuario], (err, resultados) => {
        if (err) {
            console.error('Error al obtener el perfil del usuario:', err);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }

        if (resultados.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Devuelve los datos del usuario junto con el nombre de la clase
        res.json(resultados[0]);
    });
};


exports.actualizarPerfil = async (req, res) => {
    const { id_usuario, nombre, apellido, gmail, fecha_nacimiento } = req.body;

    // Actualiza el usuario en la base de datos
    db.query(
        'UPDATE usuarios SET nombre = ?, apellido = ?, gmail = ?, fecha_nacimiento = ? WHERE id_usuario = ?',
        [nombre, apellido, gmail, fecha_nacimiento, id_usuario],
        (err, resultados) => {
            if (err) {
                console.error('Error al actualizar el usuario:', err);
                return res.status(500).json({ message: 'Error interno del servidor' });
            }

            if (resultados.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            res.status(200).json({ message: 'Perfil actualizado exitosamente' });
        }
    );
};
