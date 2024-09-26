const express = require('express');
const clases = require('../controller/crud_clases');
const router = express.Router();


// Rutas para manejar clases
router.get('/traer_clases', clases.traer);
router.get('/obtener_clase/:id', clases.obtenerClase);
router.post('/agregar_clase', clases.agregarClase);
router.post('/actualizar_clase/:id', clases.actualizarClase);
router.delete('/eliminar_clase/:id', clases.eliminarClase);


module.exports = router;
