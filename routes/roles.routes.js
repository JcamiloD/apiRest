const express = require('express');
const roles = require('../controller/roles_controller');

const router = express.Router();

// router.post('/agregar_usuario',estudiante.agregarUsuario)
router.get('/traer_roles',roles.traer)
router.get('/obtener_permisos', roles.obtenerPermisos)
router.get('/obtener_permisos_rol/:rolId', roles.obtenerPermisosPorRol)
// router.post('/actualizar/:id', estudiante.editarUsuario)   
// router.delete('/eliminar/:id', estudiante.eliminar)

module.exports = router;