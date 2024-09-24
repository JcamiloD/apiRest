const express = require('express');
const perfil = require('../controller/perfilController');

const router = express.Router();

router.get('/obtenerPerfil', perfil.obtenerPerfil);

router.post('/actualizarPerfil', perfil.actualizarPerfil);

module.exports = router;