const express = require('express');
const asistencia = require('../controller/asistenciaController');

const router = express.Router();

router.get('/obtener_asistenciaAdmin', asistencia.obtenerAsistencia)

router.get('/obtener_estudiantes', asistencia.obtenerEstudiantes)




//camilo
router.get('/claseEstudiante/:id_clase', asistencia.obtenerEstudiantesPorClase);

router.delete('/eliminarAsistencia/:id', asistencia.eliminarAsistencia)

router.put('/actualizarAsistencia/:id', asistencia.actualizarAsistencia)

router.post('/agregarAsistencia', asistencia.agregarAsistencia)

router.get('/soloBoxeo', asistencia.soloboxeo)

router.get('/soloMixtas', asistencia.obtenerAsistenciaMixtas);
router.get('/soloParkour', asistencia.obtenerAsistenciaParkour);



router,
module.exports = router;