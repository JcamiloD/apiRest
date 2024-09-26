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

exports.traerEventos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, c.nombre_clase
      FROM eventos e
      JOIN clases c ON e.id_clase = c.id_clase
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

exports.traerEventosPorNombreClase = async (req, res) => {
  console.log("holaaaaaaaaaaaa")
  const { nombre_clase } = req.params; // Obtener el nombre_clase del parámetro de la ruta
  try {
    const [rows] = await pool.query(`
      SELECT e.*, c.nombre_clase
      FROM eventos e
      JOIN clases c ON e.id_clase = c.id_clase
      WHERE c.nombre_clase = ?
    `, [nombre_clase]); // Filtrar por el nombre_clase proporcionado
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener eventos de la clase' });
  }
};

exports.obtenerEvento = async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM eventos WHERE id_evento = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el evento' });
  }
};

exports.agregarEvento = async (req, res) => {
  console.log("Hola")
  const { 
    nombre_evento, descripcion, tipo_evento, ubicacion, fecha_inicio, fecha_fin, 
    color_evento, id_clase, duracion, notificar, descripcion_notificacion 
  } = req.body;

  const fecha_hora_inicio = `${fecha_inicio} 00:00:00`;
  const fecha_hora_final = `${fecha_fin} 23:59:59`;

  try {

    const descripcionNotif = notificar === "si" ? descripcion_notificacion : null;

    const [result] = await pool.query(`
      INSERT INTO eventos 
        (nombre_evento, descripcion, tipo_evento, ubicacion, fecha_hora_inicio, fecha_hora_final, 
        color_evento, id_clase, duracion, notificar, descripcion_notificacion) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombre_evento, descripcion, tipo_evento, ubicacion, fecha_hora_inicio, fecha_hora_final, 
      color_evento, id_clase, duracion, notificar, descripcionNotif
    ]);

    res.json({ id_evento: result.insertId });
  } catch (error) {
    console.error('Error al agregar el evento:', error);
    res.status(500).json({ error: 'Error al agregar el evento' });
  }
};

exports.actualizarEvento = async (req, res) => {
  const { id } = req.params;
  const { 
    nombre_evento, descripcion, tipo_evento, ubicacion, fecha_hora_inicio, fecha_hora_final, 
    color_evento, id_clase, duracion, notificar, descripcion_notificacion 
  } = req.body;

  console.log(req.body); // Para depuración
  try {
    const updates = [];
    const values = [];

    // Verificar si cada campo está presente y agregarlo a la consulta
    if (nombre_evento) {
      updates.push('nombre_evento = ?');
      values.push(nombre_evento);
    }
    if (descripcion) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (tipo_evento) {
      updates.push('tipo_evento = ?');
      values.push(tipo_evento);
    }
    if (ubicacion) {
      updates.push('ubicacion = ?');
      values.push(ubicacion);
    }
    if (fecha_hora_inicio) {
      updates.push('fecha_hora_inicio = ?');
      values.push(fecha_hora_inicio);
    }
    if (fecha_hora_final) {
      updates.push('fecha_hora_final = ?');
      values.push(fecha_hora_final);
    }
    if (color_evento) {
      updates.push('color_evento = ?');
      values.push(color_evento);
    }
    if (id_clase) {
      updates.push('id_clase = ?');
      values.push(id_clase);
    }
    if (duracion) {
      updates.push('duracion = ?');
      values.push(duracion);
    }

    // Manejar el campo de notificación
    if (notificar !== undefined) {
      updates.push('notificar = ?');
      values.push(notificar);

      // Manejar descripcion_notificacion
      if (notificar === "si") { // Cambia "si" por el valor correcto que esperas
        if (descripcion_notificacion) {
          updates.push('descripcion_notificacion = ?');
          values.push(descripcion_notificacion);
        } else {
          return res.status(400).json({ success: false, message: 'Se requiere descripcion_notificacion cuando se selecciona notificar.' });
        }
      } else {
        updates.push('descripcion_notificacion = NULL');
      }
    }

    // Verificar si se proporcionaron campos para actualizar
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron datos para actualizar' });
    }

    // Validaciones de fecha
    if (fecha_hora_inicio && fecha_hora_final) {
      const inicio = new Date(fecha_hora_inicio);
      const final = new Date(fecha_hora_final);
      
      if (inicio < new Date()) {
        return res.status(400).json({ success: false, message: 'La fecha de inicio no puede ser anterior a la fecha actual.' });
      }
      if (final < inicio) {
        return res.status(400).json({ success: false, message: 'La fecha de finalización no puede ser anterior a la fecha de inicio.' });
      }
    }

    values.push(id); // Agregar el ID al final de los valores

    // Construir la consulta SQL
    const sql = `UPDATE eventos SET ${updates.join(', ')} WHERE id_evento = ?`;
    const [result] = await pool.query(sql, values);

    // Verificar si la actualización fue exitosa
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado o no actualizado' });
    }

    return res.json({ success: true, message: 'Evento actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el evento:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar el evento' });
  }
};


exports.eliminarEvento = async (req, res) => {
  const id = req.params.id;
  console.log(id)
  try {
    await pool.query('DELETE FROM eventos WHERE id_evento = ?', [id]);
    res.json({ message: 'Evento eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
};
