

const express = require('express');
const estudiante = require('../controller/crud_estudiantes');

const router = express.Router();

router.post('/agregar_usuario',estudiante.agregarUsuario)
router.get('/traer',estudiante.traer)
router.delete('/eliminar/:id', estudiante.eliminar)
router.post('/actualizar/:id', estudiante.actualizarUsuario)   

module.exports = router;