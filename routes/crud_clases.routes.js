

const express = require('express');
const clase = require('../controller/crud_clases');

const router = express.Router();

router.get('/traer_clases',clase.traer)

module.exports = router;