// catalogo.routes.js
const express = require('express');
const router = express.Router();
const catalogoController = require('../controller/catalogoController'); // Cambia la ruta si es necesario
const upload = require('../config/multerConfig');

// Ruta para añadir un producto
    router.post('/add-producto', upload.single('file'),catalogoController.addProducto, (req, res) => {
        console.log('Campos del formulario:', req.body);
        console.log('Archivo subido:', req.file);
        res.json({ success: true });
    });


    
    router.delete('/delete-producto/:id_catalogo', catalogoController.deleteProducto);
    router.put('/update-producto/:id_catalogo', upload.single('file'), catalogoController.updateProducto);

    router.get('/get-catalogo', catalogoController.getCatalogo);
    router.get('/get-all', catalogoController.getAll);

module.exports = router;