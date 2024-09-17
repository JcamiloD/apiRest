// routes/novedades.routes.js
const express = require('express');
const novedades = require('../controller/novedadController');
const router = express.Router();


router.get('/traer_novedades', novedades.traerNovedades);
router.get('/obtener_novedad/:id', novedades.obtenerNovedad);
router.post('/agregar_novedad', novedades.agregarNovedad);
router.post('/actualizar_novedad/:id', novedades.actualizarNovedad);
router.delete('/eliminar_novedad/:id', novedades.eliminarNovedad);

module.exports = router;
