const db = require('../database/db');
const bcrypt = require('bcrypt');

exports.traer = async (req, res) => {
    const query = `
        SELECT 
            r.id_rol,
            r.nombre_rol,
            GROUP_CONCAT(p.nombre_permiso SEPARATOR ', ') AS permisos
        FROM 
            rol r
        LEFT JOIN 
            permisos_rol pr ON r.id_rol = pr.id_rol
        LEFT JOIN 
            permisos p ON pr.id_permiso = p.id_permiso
        GROUP BY 
            r.id_rol, r.nombre_rol
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener roles y permisos', details: err.message });
        }
        // Convertir la cadena de permisos a un array
        results.forEach(rol => {
            rol.permisos = rol.permisos ? rol.permisos.split(', ').map(permiso => permiso.trim()) : [];
        });
        res.status(200).json(results);
    });
};


exports.obtenerPermisos = (req, res) => {
    try {
        const query = 'SELECT * FROM permisos'; // Ajusta esta consulta según tu estructura de base de datos
        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener permisos', details: err.message });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: error.message });
    }
};

exports.obtenerPermisosPorRol = async (req, res) => {
    const { rolId } = req.params;
    try {
        const query = `
            SELECT p.id_permiso, p.nombre_permiso
            FROM permisos p
            INNER JOIN permisos_rol pr ON p.id_permiso = pr.id_permiso
            WHERE pr.id_rol = ?
        `;
        db.query(query, [rolId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener permisos por rol', details: err.message });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        console.error('Error al obtener permisos por rol:', error);
        res.status(500).send('Error interno del servidor');
    }
};

// Controlador para agregar o actualizar permisos
exports.actualizarPermisos = (req, res) => {
    const { rolId, permisos } = req.body;

    // Verificar que los datos recibidos son válidos
    if (!rolId || !Array.isArray(permisos)) {
        console.error('Datos inválidos:', { rolId, permisos });
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    console.log('Iniciando actualización de permisos para rolId:', rolId);

    db.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar la transacción:', err.message);
            return res.status(500).json({ error: 'Error al iniciar la transacción', details: err.message });
        }

        // Eliminar permisos antiguos
        const deleteQuery = 'DELETE FROM permisos_rol WHERE id_rol = ?';
        db.query(deleteQuery, [rolId], (err, result) => {
            if (err) {
                console.error('Error al eliminar permisos antiguos:', err.message);
                return db.rollback(() => {
                    res.status(500).json({ error: 'Error al eliminar permisos antiguos', details: err.message });
                });
            }

            console.log('Permisos antiguos eliminados para rolId:', rolId);

            // Insertar permisos nuevos
            const insertQuery = 'INSERT INTO permisos_rol (id_rol, id_permiso) VALUES (?, ?)';
            const permisosPromises = permisos.map(permisoId => {
                return new Promise((resolve, reject) => {
                    db.query(insertQuery, [rolId, permisoId], (err, result) => {
                        if (err) {
                            console.error('Error al insertar nuevo permiso:', err.message);
                            return reject(err);
                        }
                        resolve();
                    });
                });
            });

            // Ejecutar todas las inserciones de permisos
            Promise.all(permisosPromises)
                .then(() => {
                    db.commit(err => {
                        if (err) {
                            console.error('Error al confirmar la transacción:', err.message);
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error al confirmar la transacción', details: err.message });
                            });
                        }
                        console.log('Permisos actualizados exitosamente para rolId:', rolId);
                        res.json({ message: 'Permisos actualizados exitosamente' });
                    });
                })
                .catch(err => {
                    console.error('Error al insertar nuevos permisos:', err.message);
                    db.rollback(() => {
                        res.status(500).json({ error: 'Error al insertar nuevos permisos', details: err.message });
                    });
                });
        });
    });
};