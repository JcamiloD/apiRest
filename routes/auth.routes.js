const express = require('express');
const auth = require('../controller/authController');

const router = express.Router();

router.post('/register', auth.register)
router.post('/login', auth.login)
router.post('/get_role', auth.get_role)
router.post('/enviar-codigo', auth.enviarCodigo)
router.post('/verificarCodigo', auth.restablecerContraseña);



module.exports = router;