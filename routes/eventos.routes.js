// routes/eventos.routes.js
const express = require('express');
const eventos = require('../controller/crud_eventos');
const router = express.Router();

router.get('/traer_eventos', eventos.traerEventos);
router.get('/obtener_evento/:id', eventos.obtenerEvento);
router.post('/agregar_evento', eventos.agregarEvento);
router.post('/actualizar_evento/:id', eventos.actualizarEvento);
router.delete('/eliminar_evento/:id', eventos.eliminarEvento);
router.get('/traerEventosPorNombreClase/:nombre_clase', eventos.traerEventosPorNombreClase);

module.exports = router;
