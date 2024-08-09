const express = require('express');
const bodyParser = require('body-parser');
const auth = require('./routes/auth.routes') 
require('dotenv').config();



const app = express();
app.use(express.json());

app.use(bodyParser.json());


app.use('/api', auth)




const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});

