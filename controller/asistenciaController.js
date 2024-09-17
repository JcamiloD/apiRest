const db = require('../database/db');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

// Crear una conexión a la base de datos
const dbbb = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'yamix'
});


exports.createAsistencia = async (req, res) => {
    try {
        const { id_clase, fecha_asistencia, estudiantes } = req.body;

        // Validar datos de entrada
        if (!id_clase || !fecha_asistencia || !Array.isArray(estudiantes) || estudiantes.length === 0) {
            return res.status(400).json({ message: 'Datos incompletos o inválidos. Verifica que estudiantes sea un array y tenga elementos.' });
        }

        // Insertar el registro de asistencia
        const [result] = await dbbb.query(`
            INSERT INTO asistencia (id_clase, fecha_asistencia) 
            VALUES (?, ?)`, [id_clase, fecha_asistencia]
        );

        console.log('Resultado de la inserción en asistencia:', result);

        const id_asistencia = result.insertId;

        // Verifica que el id_asistencia sea válido
        if (!id_asistencia) {
            return res.status(500).json({ message: 'Error al obtener el ID de la asistencia.' });
        }

        // Insertar registros en la tabla intermedia asistencia_usuarios
        const promises = estudiantes.map(estudiante => {
            if (!estudiante.id_usuario || estudiante.presente === undefined) {
                console.error(`Datos incompletos del estudiante: ${JSON.stringify(estudiante)}`);
                return Promise.reject(new Error('Datos de estudiante incompletos.'));
            }

            console.log(`Insertando en asistencia_usuarios: id_asistencia=${id_asistencia}, id_usuario=${estudiante.id_usuario}, presente=${estudiante.presente}`);

            return dbbb.query(`
                INSERT INTO asistencia_usuarios (id_asistencia, id_usuario, presente)
                VALUES (?, ?, ?)`, [id_asistencia, estudiante.id_usuario, estudiante.presente]
            );
        });

        await Promise.all(promises);

        res.status(201).json({ message: 'Asistencia registrada con éxito' });
    } catch (error) {
        console.error('Error en createAsistencia:', error); // Agrega más detalles para depurar
        res.status(500).json({ message: 'Error al registrar asistencia', error: error.message });
    }
};


exports.getAsistenciasPorUsuario = async (req, res) => {
    const { id_usuario } = req.params;

    try {
        // Consultar todas las asistencias para el usuario especificado
        const [asistencias] = await dbbb.query(`
            SELECT a.id_asistencia, a.id_clase, a.fecha_asistencia, c.nombre_clase
            FROM asistencia a
            JOIN clases c ON a.id_clase = c.id_clase
            JOIN asistencia_usuarios au ON a.id_asistencia = au.id_asistencia
            WHERE au.id_usuario = ?
        `, [id_usuario]);

        // Verificar si se encontraron asistencias
        if (asistencias.length === 0) {
            return res.status(200).json([]);
        }
        

        // Consultar los detalles de los estudiantes para cada asistencia
        const results = await Promise.all(asistencias.map(async asistencia => {
            const [estudiantes] = await dbbb.query(`
                SELECT au.id_asistencia, u.id_usuario, u.nombre AS nombre_usuario, 
                    CASE au.presente 
                        WHEN 1 THEN 'sí' 
                        ELSE 'no' 
                    END AS presente
                FROM asistencia_usuarios au
                JOIN usuarios u ON au.id_usuario = u.id_usuario
                WHERE au.id_asistencia = ?
            `, [asistencia.id_asistencia]);

            return {
                ...asistencia,
                estudiantes
            };
        }));

        res.status(200).json(results);
    } catch (error) {
        console.error('Error al obtener asistencias por usuario:', error);
        res.status(500).json({ message: 'Error al obtener asistencias por usuario', error: error.message });
    }
};


exports.getAsistencias = async (req, res) => {
    try {
        // Consultar todas las asistencias con detalles de la clase
        const [asistencias] = await dbbb.query(`
            SELECT a.id_asistencia, a.id_clase, a.fecha_asistencia, c.nombre_clase
            FROM asistencia a
            JOIN clases c ON a.id_clase = c.id_clase
        `);

        // Verificar si se encontraron asistencias
        if (asistencias.length === 0) {
            return res.status(404).json({ message: 'No se encontraron asistencias.' });
        }

        // Consultar los detalles de los estudiantes para cada asistencia
        const results = await Promise.all(asistencias.map(async asistencia => {
            const [estudiantes] = await dbbb.query(`
                SELECT au.id_asistencia, u.id_usuario, u.nombre AS nombre_usuario, 
                    CASE au.presente 
                        WHEN 1 THEN 'sí' 
                        ELSE 'no' 
                    END AS presente
                FROM asistencia_usuarios au
                JOIN usuarios u ON au.id_usuario = u.id_usuario
                WHERE au.id_asistencia = ?
            `, [asistencia.id_asistencia]);

            return {
                ...asistencia,
                estudiantes
            };
        }));

        res.status(200).json(results);
    } catch (error) {
        console.error('Error al obtener asistencias:', error);
        res.status(500).json({ message: 'Error al obtener asistencias', error: error.message });
    }
};




exports.updateAsistencia = async (req, res) => {
    try {
        const { id_asistencia } = req.params;  // Obtener id_asistencia de los parámetros de la ruta
        const { fecha_asistencia, estudiantes } = req.body;

        // Validar datos de entrada
        if (!id_asistencia || !fecha_asistencia || !Array.isArray(estudiantes)) {
            return res.status(400).json({ message: 'Datos incompletos o inválidos.' });
        }

        // Actualizar el registro de asistencia
        const [result] = await dbbb.query(`
            UPDATE asistencia 
            SET fecha_asistencia = ? 
            WHERE id_asistencia = ?`, [fecha_asistencia, id_asistencia]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Asistencia no encontrada.' });
        }

        // Actualizar los registros en la tabla intermedia asistencia_usuarios
        const promises = estudiantes.map(estudiante => {
            if (!estudiante.id_usuario || estudiante.presente === undefined) {
                console.error(`Datos incompletos del estudiante: ${JSON.stringify(estudiante)}`);
                return Promise.reject(new Error('Datos de estudiante incompletos.'));
            }

            return dbbb.query(`
                INSERT INTO asistencia_usuarios (id_asistencia, id_usuario, presente)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE presente = ?`, 
                [id_asistencia, estudiante.id_usuario, estudiante.presente, estudiante.presente]
            );
        });

        await Promise.all(promises);

        res.status(200).json({ message: 'Asistencia actualizada con éxito' });
    } catch (error) {
        console.error('Error al actualizar asistencia:', error);
        res.status(500).json({ message: 'Error al actualizar asistencia', error: error.message });
    }
};

exports.actualizarasis = async (req, res) => {
    try {
        const { id_asistencia } = req.params;
        const { fecha_asistencia, id_clase, estudiantes } = req.body;

        // Validar datos de entrada
        if (!id_asistencia || !fecha_asistencia || !id_clase || !Array.isArray(estudiantes)) {
            console.error('Datos incompletos o inválidos:', req.body); // Agregar esta línea para depuración
            return res.status(400).json({ message: 'Datos incompletos o inválidos.' });
        }

        console.log('Datos recibidos del frontend:', { id_asistencia, fecha_asistencia, id_clase, estudiantes }); // Agregar esta línea para depuración

        // Actualizar el registro de asistencia
        const [updateResult] = await dbbb.query(`
            UPDATE asistencia 
            SET fecha_asistencia = ?, id_clase = ? 
            WHERE id_asistencia = ?`, 
            [fecha_asistencia, id_clase, id_asistencia]
        );

        if (updateResult.affectedRows === 0) {
            console.error('Asistencia no encontrada:', id_asistencia); // Agregar esta línea para depuración
            return res.status(404).json({ message: 'Asistencia no encontrada.' });
        }

        console.log('Registro de asistencia actualizado exitosamente');

        // Eliminar los registros antiguos en la tabla intermedia asistencia_usuarios
        const [deleteResult] = await dbbb.query(`
            DELETE FROM asistencia_usuarios 
            WHERE id_asistencia = ?`, 
            [id_asistencia]
        );

        console.log('Registros antiguos eliminados:', deleteResult.affectedRows);

        // Construir la consulta para insertar o actualizar múltiples registros
        const values = estudiantes.map(estudiante => 
            `(${dbbb.escape(id_asistencia)}, ${dbbb.escape(estudiante.id_usuario)}, ${dbbb.escape(estudiante.presente)})`
        ).join(', ');

        const query = `
            INSERT INTO asistencia_usuarios (id_asistencia, id_usuario, presente)
            VALUES ${values}
            ON DUPLICATE KEY UPDATE presente = VALUES(presente)
        `;

        console.log('Consulta para insertar o actualizar:', query);

        // Insertar los nuevos registros en la tabla intermedia asistencia_usuarios
        const [insertResult] = await dbbb.query(query);

        console.log('Registros nuevos insertados o actualizados:', insertResult.affectedRows);

        res.status(200).json({ message: 'Asistencia actualizada con éxito' });
    } catch (error) {
        console.error('Error al actualizar asistencia:', error); // Agregar esta línea para depuración
        res.status(500).json({ message: 'Error al actualizar asistencia', error: error.message });
    }
};




exports.deleteAsistencia = async (req, res) => {
    try {
        const { id_asistencia } = req.params;

        // Validar que el id_asistencia esté presente
        if (!id_asistencia) {
            return res.status(400).json({ message: 'El id_asistencia es obligatorio.' });
        }

        // Eliminar los registros en la tabla intermedia asistencia_usuarios
        await dbbb.query(`
            DELETE FROM asistencia_usuarios 
            WHERE id_asistencia = ?`, [id_asistencia]
        );

        // Eliminar el registro de asistencia
        const [result] = await dbbb.query(`
            DELETE FROM asistencia 
            WHERE id_asistencia = ?`, [id_asistencia]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Asistencia no encontrada.' });
        }

        res.status(200).json({ message: 'Asistencia eliminada con éxito' });
    } catch (error) {
        console.error('Error al eliminar asistencia:', error);
        res.status(500).json({ message: 'Error al eliminar asistencia', error: error.message });
    }
};

































exports.getAsistenciaPorId = async (req, res) => {
    const { id_asistencia } = req.params; // Obtén el id_asistencia del parámetro de la ruta

    try {
        // Consultar la asistencia específica con detalles de la clase
        const [asistencia] = await dbbb.query(`
            SELECT a.id_asistencia, a.id_clase, a.fecha_asistencia, c.nombre_clase
            FROM asistencia a
            JOIN clases c ON a.id_clase = c.id_clase
            WHERE a.id_asistencia = ?
        `, [id_asistencia]);

        // Verificar si se encontró la asistencia
        if (asistencia.length === 0) {
            return res.status(404).json({ message: 'Asistencia no encontrada.' });
        }

        // Consultar los detalles de los estudiantes para la asistencia específica
        const [estudiantes] = await dbbb.query(`
            SELECT au.id_asistencia, u.id_usuario, u.nombre AS nombre_usuario, 
                CASE au.presente 
                    WHEN 1 THEN 'sí' 
                    ELSE 'no' 
                END AS presente
            FROM asistencia_usuarios au
            JOIN usuarios u ON au.id_usuario = u.id_usuario
            WHERE au.id_asistencia = ?
        `, [id_asistencia]);

        // Devolver los detalles de la asistencia y los estudiantes asociados
        res.status(200).json({
            ...asistencia[0], // La consulta devuelve un array, tomamos el primer elemento
            estudiantes
        });
    } catch (error) {
        console.error('Error al obtener la asistencia:', error);
        res.status(500).json({ message: 'Error al obtener la asistencia', error: error.message });
    }
};

















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
exports.obtenerAsistenciaBoxeo = async (req, res) => {
    try {
        // Consultar todas las asistencias de clases de 'boxeo'
        const [asistencias] = await dbbb.query(`
            SELECT a.id_asistencia, a.id_clase, a.fecha_asistencia, c.nombre_clase
            FROM asistencia a
            JOIN clases c ON a.id_clase = c.id_clase
            WHERE c.nombre_clase = 'boxeo'
        `);

        // Verificar si se encontraron asistencias
        if (asistencias.length === 0) {
            return res.status(404).json({ message: 'No se encontraron asistencias para clases de boxeo.' });
        }

        // Consultar los detalles de los estudiantes para cada asistencia
        const results = await Promise.all(asistencias.map(async asistencia => {
            const [estudiantes] = await dbbb.query(`
                SELECT au.id_asistencia, u.id_usuario, u.nombre AS nombre_usuario, 
                    CASE au.presente 
                        WHEN 1 THEN 'sí' 
                        ELSE 'no' 
                    END AS presente
                FROM asistencia_usuarios au
                JOIN usuarios u ON au.id_usuario = u.id_usuario
                WHERE au.id_asistencia = ?
            `, [asistencia.id_asistencia]);

            return {
                ...asistencia,
                estudiantes
            };
        }));

        res.status(200).json(results);
    } catch (error) {
        console.error('Error al obtener asistencias de boxeo:', error);
        res.status(500).json({ message: 'Error al obtener asistencias de boxeo', error: error.message });
    }
};




exports.obtenerAsistenciaParkour = async (req, res) => {
    try {
        // Consultar todas las asistencias de clases de 'parkour'
        const [asistencias] = await dbbb.query(`
            SELECT a.id_asistencia, a.id_clase, a.fecha_asistencia, c.nombre_clase
            FROM asistencia a
            JOIN clases c ON a.id_clase = c.id_clase
            WHERE c.nombre_clase = 'parkour'
        `);

        // Verificar si se encontraron asistencias
        if (asistencias.length === 0) {
            return res.status(404).json({ message: 'No se encontraron asistencias para clases de parkour.' });
        }

        // Consultar los detalles de los estudiantes para cada asistencia
        const results = await Promise.all(asistencias.map(async asistencia => {
            const [estudiantes] = await dbbb.query(`
                SELECT au.id_asistencia, u.id_usuario, u.nombre AS nombre_usuario, 
                    CASE au.presente 
                        WHEN 1 THEN 'sí' 
                        ELSE 'no' 
                    END AS presente
                FROM asistencia_usuarios au
                JOIN usuarios u ON au.id_usuario = u.id_usuario
                WHERE au.id_asistencia = ?
            `, [asistencia.id_asistencia]);

            return {
                ...asistencia,
                estudiantes
            };
        }));

        res.status(200).json(results);
    } catch (error) {
        console.error('Error al obtener asistencias de parkour:', error);
        res.status(500).json({ message: 'Error al obtener asistencias de parkour', error: error.message });
    }
};



exports.obtenerAsistenciaMixtas = async (req, res) => {
    try {
        // Consultar todas las asistencias de clases mixtas
        const [asistencias] = await dbbb.query(`
            SELECT a.id_asistencia, a.id_clase, a.fecha_asistencia, c.nombre_clase
            FROM asistencia a
            JOIN clases c ON a.id_clase = c.id_clase
            WHERE c.nombre_clase = 'mixtas'
        `);

        // Verificar si se encontraron asistencias
        if (asistencias.length === 0) {
            return res.status(404).json({ message: 'No se encontraron asistencias para clases mixtas.' });
        }

        // Consultar los detalles de los estudiantes para cada asistencia
        const results = await Promise.all(asistencias.map(async asistencia => {
            const [estudiantes] = await dbbb.query(`
                SELECT au.id_asistencia, u.id_usuario, u.nombre AS nombre_usuario, 
                    CASE au.presente 
                        WHEN 1 THEN 'sí' 
                        ELSE 'no' 
                    END AS presente
                FROM asistencia_usuarios au
                JOIN usuarios u ON au.id_usuario = u.id_usuario
                WHERE au.id_asistencia = ?
            `, [asistencia.id_asistencia]);

            return {
                ...asistencia,
                estudiantes
            };
        }));

        res.status(200).json(results);
    } catch (error) {
        console.error('Error al obtener asistencias:', error);
        res.status(500).json({ message: 'Error al obtener asistencias', error: error.message });
    }
};
