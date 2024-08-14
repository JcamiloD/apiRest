

const express = require('express');
const estudiante = require('../controller/crud_estudiantes');

const router = express.Router();

router.post('/agregar_usuario',estudiante.agregarUsuario)
router.get('/traer_usuarios',estudiante.traer)
router.get('/obtener_usuario/:id', estudiante.obtenerUsuario)
router.post('/actualizar/:id', estudiante.editarUsuario)   
router.delete('/eliminar/:id', estudiante.eliminar)

module.exports = router;