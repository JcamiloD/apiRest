// catalogoController.js
const db = require('../database/db');
const jwt = require('jsonwebtoken');

const fs = require('fs');
const path = require('path');


const getTokenFromHeader = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7, authHeader.length);
        return token;
    }
    return null;
};



const addProducto = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const { nombre_producto, descripcion, id_clase, link } = req.body;
    if (!nombre_producto || !descripcion || !id_clase || !link) {
        return res.status(400).json({ error: 'Faltan datos en la solicitud' });
    }

    const imagen_producto = `/uploads/${req.file.filename}`;

    if (isNaN(parseInt(id_clase))) {
        return res.status(400).json({ error: 'id_clase debe ser un número válido' });
    }

    const query = `
        INSERT INTO catalogo (nombre_producto, descripcion, imagen_producto, id_clase, link)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [nombre_producto, descripcion, imagen_producto, parseInt(id_clase),link];

    db.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al insertar el producto:', error);
            return res.status(500).json({ error: 'Error al añadir el producto' });
        }

        res.status(200).json({ message: 'Producto añadido correctamente' });
    });
};


const deleteProducto = (req, res) => {
    const { id_catalogo } = req.params;

    // Validar que id_catalogo sea un número válido
    if (isNaN(parseInt(id_catalogo))) {
        return res.status(400).json({ error: 'id_catalogo debe ser un número válido' });
    }

    // Primero, obtén la ruta de la imagen del producto
    const getImageQuery = 'SELECT imagen_producto FROM catalogo WHERE id_catalogo = ?';
    db.query(getImageQuery, [parseInt(id_catalogo)], (error, results) => {
        if (error) {
            console.error('Error al obtener la imagen del producto:', error);
            return res.status(500).json({ error: 'Error al eliminar el producto' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const imagen_producto = results[0].imagen_producto;

        // Elimina el producto de la base de datos
        const deleteQuery = 'DELETE FROM catalogo WHERE id_catalogo = ?';
        db.query(deleteQuery, [parseInt(id_catalogo)], (error, results) => {
            if (error) {
                console.error('Error al eliminar el producto:', error);
                return res.status(500).json({ error: 'Error al eliminar el producto' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            // Elimina la imagen del sistema de archivos
            const imagePath = path.join(__dirname, '..', imagen_producto);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error al eliminar la imagen:', err);
                }
            });

            res.status(200).json({ message: 'Producto eliminado correctamente' });
        });
    });
};


const updateProducto = (req, res) => {
    
    const { id_catalogo } = req.params;
    const { nombre_producto, descripcion, id_clase, link } = req.body;
    const imagen_producto = req.file ? `/uploads/${req.file.filename}` : null;

    const idCatalogoNum = parseInt(id_catalogo, 10);
    const idClaseNum = parseInt(id_clase, 10);

    if (isNaN(idCatalogoNum) || isNaN(idClaseNum)) {
        return res.status(400).json({ error: 'id_catalogo y id_clase deben ser números válidos' });
    }

    const getImageQuery = 'SELECT imagen_producto FROM catalogo WHERE id_catalogo = ?';
    db.query(getImageQuery, [idCatalogoNum], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error al obtener la imagen del producto' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const currentImagePath = results[0]?.imagen_producto;
        let query = 'UPDATE catalogo SET nombre_producto = ?, descripcion = ?, id_clase = ?, link = ?';
        let values = [nombre_producto, descripcion, idClaseNum, link];

        if (imagen_producto) {
            query += ', imagen_producto = ?';
            values.push(imagen_producto);
        }

        query += ' WHERE id_catalogo = ?';
        values.push(idCatalogoNum);

        db.query(query, values, (error, results) => {
            if (error) {
                return res.status(500).json({ error: 'Error al actualizar el producto' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            if (imagen_producto && currentImagePath && currentImagePath !== imagen_producto) {
                const currentImageFullPath = path.join(__dirname, '..', currentImagePath);

                fs.unlink(currentImageFullPath, (err) => {
                    if (err) {
                        console.error('Error al eliminar la imagen:', err);
                        // Optional: Respond with an error if deletion fails
                    }
                });
            }

            res.status(200).json({ message: 'Producto actualizado correctamente' });
        });
    });
};

const getCatalogo = (req, res) => {
    const token = getTokenFromHeader(req);

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        // Decodifica el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { clase } = decoded; // Extrae la clase del token

        // Consulta para obtener el id_clase basado en el nombre de la clase
        const queryClase = `
            SELECT id_clase
            FROM clases
            WHERE nombre_clase = ?
        `;
        db.query(queryClase, [clase], (error, results) => {
            if (error) {
                console.error('Error al obtener el id_clase:', error);
                return res.status(500).json({ error: 'Error al obtener la clase' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Clase no encontrada' });
            }

            const id_clase = results[0].id_clase;

            // Consulta para obtener el catálogo basado en el id_clase
            const queryCatalogo = `
                SELECT id_catalogo, nombre_producto, descripcion, imagen_producto, id_clase, link
                FROM catalogo
                WHERE id_clase = ?
            `;

            db.query(queryCatalogo, [id_clase], (error, results) => {
                if (error) {
                    console.error('Error al obtener el catálogo:', error);
                    return res.status(500).json({ error: 'Error al obtener el catálogo' });
                }

                // Si no hay productos, devolver un array vacío y un mensaje
                if (results.length === 0) {
                    return res.status(200).json({
                        message: 'No se encontraron productos en el catálogo para esta clase',
                        productos: []
                    });
                }

                // Modifica las rutas de las imágenes para que apunten correctamente
                const productos = results.map(producto => ({
                    ...producto,
                    imagen_producto: `${req.protocol}://${req.get('host')}${producto.imagen_producto}` // Genera la URL completa
                }));

                res.status(200).json(productos);
            });
        });
    } catch (error) {
        console.error('Error al decodificar el token:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
};



const getAll = (req, res) => {
    
    const queryCatalogo = `
        SELECT c.id_catalogo, c.nombre_producto, c.descripcion, c.imagen_producto, cl.nombre_clase, c.link 
        FROM catalogo c
        JOIN clases cl ON c.id_clase = cl.id_clase
    `;

    db.query(queryCatalogo, (error, results) => {
        if (error) {
            // Registra el error específico de la consulta
            console.error('Error en la consulta SQL:', error);
            return res.status(500).json({ error: 'Error al obtener el catálogo' });
        }

        if (results.length === 0) {
            // Si la tabla está vacía, envía un mensaje informando que no hay productos
            return res.status(404).json({ message: 'No se encontraron productos en el catálogo' });
        }

        const productos = results.map(producto => ({
            ...producto,
            imagen_producto: `${req.protocol}://${req.get('host')}${producto.imagen_producto}`
        }));

        res.status(200).json(productos);
    });
};





module.exports = {
    getCatalogo,
    addProducto,
    deleteProducto,
    updateProducto,
    getAll
};