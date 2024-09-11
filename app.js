const express = require('express');
const bodyParser = require('body-parser');

const auth = require('./routes/auth.routes');
const usuario = require('./routes/crud_estudiantes.routes');
const clase = require('./routes/crud_clases.routes');
const roles = require('./routes/roles.routes');
const eventos = require('./routes/eventos.routes'); // Asegúrate de que el archivo es correcto


const auth = require('./routes/auth.routes') 
const usuario =require('./routes/crud_estudiantes.routes')
const clase =require('./routes/crud_clases.routes')
const roles =require('./routes/roles.routes')

const asistencias =require('./routes/asistencias.routes')

const catalogoRoutes = require('./routes/catalogo.routes');
const path = require('path')

require('dotenv').config();




const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




app.use('/api', auth, usuario, clase, roles, catalogoRoutes, asistencias, eventos)   


app.use((req, res, next) => {
    console.log(`Solicitud ${req.method} recibida en ${req.url}`);
    next();
});

const cors = require('cors');
app.use(cors());


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});

