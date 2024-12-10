const router = require('express').Router();
const { authMiddleware } = require('../../middlewares/authMiddleware');
const productController = require('../../controllers/dashboard/productController'); // Importa el controlador correctamente

// Rutas para manejar productos
router.post('/product-add', authMiddleware, productController.add_product); // Ruta para agregar un producto
router.get('/products-get', authMiddleware, productController.products_get); // Ruta para obtener todos los productos
router.get('/product-get/:productId', authMiddleware, productController.product_get); // Ruta para obtener un producto específico
router.post('/product-update', authMiddleware, productController.product_update); // Ruta para actualizar un producto
router.post('/product-image-update', authMiddleware, productController.product_image_update); // Ruta para actualizar la imagen de un producto
router.delete('/product-delete/:productId', authMiddleware, productController.delete_product); // Ruta para eliminar un producto

module.exports = router;
