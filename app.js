const express = require('express');
const bodyParser = require('body-parser');
<<<<<<< HEAD
const auth = require('./routes/auth.routes');
const usuario = require('./routes/crud_estudiantes.routes');
const clase = require('./routes/crud_clases.routes');
const roles = require('./routes/roles.routes');
const eventos = require('./routes/eventos.routes'); // Asegúrate de que el archivo es correcto
=======
const auth = require('./routes/auth.routes') 
const usuario =require('./routes/crud_estudiantes.routes')
const clase =require('./routes/crud_clases.routes')
const roles =require('./routes/roles.routes')
const catalogoRoutes = require('./routes/catalogo.routes');
const path = require('path');
>>>>>>> 1823f8196e2fadeab397863f5fbbfecb588bbc83

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());

<<<<<<< HEAD
const cors = require('cors');
app.use(cors());

app.use('/api', auth, usuario, clase, roles, eventos); // Incluye las rutas de eventos
=======
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api', auth, usuario, clase, roles, catalogoRoutes)   
>>>>>>> 1823f8196e2fadeab397863f5fbbfecb588bbc83

app.use((req, res, next) => {
    console.log(`Solicitud ${req.method} recibida en ${req.url}`);
    next();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
