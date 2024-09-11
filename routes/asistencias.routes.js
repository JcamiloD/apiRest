const express = require('express');
const asistencia = require('../controller/asistenciaController');

const router = express.Router();

router.get('/obtener_asistencia', asistencia.obtenerAsistencia)
router.post('/agregar_asistencia', asistencia.agregarAsistencia)
router.get('/obtener_estudiantes', asistencia.obtenerEstudiantes)
router.post('/actualizar_asistencia', asistencia.actualizarAsistencia)
module.exports = router;