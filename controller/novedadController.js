const mysql2 = require('mysql2/promise');

const pool = mysql2.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'yamix',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Traer todas las novedades, incluyendo los datos de eventos y clases
exports.traerNovedades = async (req, res) => {
    try {
        const [novedades] = await pool.query(`
            SELECT n.*, e.nombre_evento, c.nombre_clase 
            FROM novedades n
            LEFT JOIN eventos e ON n.id_evento = e.id_evento
            LEFT JOIN clases c ON n.id_clase = c.id_clase
        `);
        res.json(novedades);
    } catch (error) {
        res.status(500).json({ error: 'Error al traer las novedades' });
    }
};
// Obtener una novedad por ID
// Obtener una novedad por ID
exports.obtenerNovedad = async (req, res) => {
    const { id } = req.params;
    try {
        const [novedad] = await pool.query(`
            SELECT n.*, e.nombre_evento, c.nombre_clase
            FROM novedades n
            LEFT JOIN eventos e ON n.id_evento = e.id_evento
            LEFT JOIN clases c ON n.id_clase = c.id_clase
            WHERE n.id_novedad = ?
        `, [id]);
        if (novedad.length === 0) {
            return res.status(404).json({ error: 'Novedad no encontrada' });
        }
        const novedadData = novedad[0];
        // Convertir la fecha al formato YYYY-MM-DD
        const fecha = new Date(novedadData.fecha).toISOString().split('T')[0];
        res.json({
            ...novedadData,
            fecha
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la novedad' });
    }
};


// Agregar una nueva novedad
exports.agregarNovedad = async (req, res) => {
    const { titulo, descripcion, fecha, id_evento, id_clase } = req.body;
    try {
        const result = await pool.query(`
            INSERT INTO novedades (titulo, descripcion, fecha, id_evento, id_clase)
            VALUES (?, ?, ?, ?, ?)
        `, [titulo, descripcion, fecha, id_evento, id_clase]);
        res.json({ message: 'Novedad agregada exitosamente', id_novedad: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar la novedad' });
    }
};



// Actualizar una novedad
exports.actualizarNovedad = async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, fecha, evento, clase } = req.body;  
    try {
        const result = await pool.query(`
            UPDATE novedades 
            SET titulo = ?, descripcion = ?, fecha = ?, id_evento = ?, id_clase = ? 
            WHERE id_novedad = ?
        `, [titulo, descripcion, fecha, evento, clase, id]);  // Usando evento y clase
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Novedad no encontrada' });
        }
        res.json({ message: 'Novedad actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la novedad' });
    }
};


// Eliminar una novedad
exports.eliminarNovedad = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM novedades WHERE id_novedad = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Novedad no encontrada' });
        }
        res.json({ message: 'Novedad eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la novedad' });
    }
};

