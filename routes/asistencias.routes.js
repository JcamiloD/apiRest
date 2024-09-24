const express = require('express');
const asistencia = require('../controller/asistenciaController');

const router = express.Router();




router.post('/createAsistencia', asistencia.createAsistencia)

router.get('/obtenerAsistencias', asistencia.getAsistencias);

router.get('/obtenerAsistenciasUsuario/:id_usuario', asistencia.getAsistenciasPorUsuario);

router.get('/obtenerUnaAsistencias/:id_asistencia', asistencia.getAsistenciaPorId);

router.put('/updateAsistencia/:id_asistencia', asistencia.updateAsistencia);

router.put('/actualizarasis/:id_asistencia', asistencia.actualizarasis);

router.delete('/deleteAsistencia/:id_asistencia', asistencia.deleteAsistencia);


























router.get('/obtener_asistenciaAdmin', asistencia.obtenerAsistencia)

router.get('/obtener_estudiantes', asistencia.obtenerEstudiantes)




//camilo
router.get('/claseEstudiante/:id_clase', asistencia.obtenerEstudiantesPorClase);

router.delete('/eliminarAsistencia/:id', asistencia.eliminarAsistencia)



router.post('/agregarAsistencia', asistencia.agregarAsistencia)

router.get('/soloBoxeo', asistencia.obtenerAsistenciaBoxeo)

router.get('/soloMixtas', asistencia.obtenerAsistenciaMixtas);
router.get('/soloParkour', asistencia.obtenerAsistenciaParkour);



router,
module.exports = router;