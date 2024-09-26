const db = require('../database/db');
const bcrypt = require('bcrypt');



exports.traer = async (req, res) => {
    const query = `
        SELECT 
            c.id_clase,
            c.nombre_clase,
            c.descripcion,
            c.tipo_clase,
            u.nombre AS nombre_instructor,
            h.dias AS dias_clase,
            h.hora_inicio AS inicio_clase,
            h.hora_final AS final_clase
        FROM 
            clases c
        LEFT JOIN 
            usuarios u ON c.id_instructor = u.id_usuario
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
