

const express = require('express');
const clase = require('../controller/crud_clases');

const router = express.Router();

router.post('/agregar_clase',clase.agregarClase)
router.get('/traer_clases',clase.traer)
router.delete('/eliminar/:id', clase.eliminar)

module.exports = router;