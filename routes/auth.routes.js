const express = require('express');
const auth = require('../controller/authController');

const router = express.Router();

router.post('/register', auth.register)
router.post('/login', auth.login)
router.post('/verify', auth.verify)
router.post('/get_role', auth.get_role)

module.exports = router;