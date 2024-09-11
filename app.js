const express = require('express');
const bodyParser = require('body-parser');
const auth = require('./routes/auth.routes');
const usuario = require('./routes/crud_estudiantes.routes');
const clase = require('./routes/crud_clases.routes');
const roles = require('./routes/roles.routes');
const eventos = require('./routes/eventos.routes'); // Asegúrate de que el archivo es correcto

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

app.use('/api', auth, usuario, clase, roles, eventos); // Incluye las rutas de eventos

app.use((req, res, next) => {
    console.log(`Solicitud ${req.method} recibida en ${req.url}`);
    next();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
