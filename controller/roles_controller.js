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
        res.status(200).json(results);
    });
};

exports.obtenerPermisos = (req, res) => {
    const query = 'SELECT id_permiso, nombre_permiso FROM permisos';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener permisos', details: err.message });
        }
        res.status(200).json(results);
    });
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