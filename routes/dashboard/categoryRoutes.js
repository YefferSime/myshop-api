const router = require('express').Router();
const { authMiddleware } = require('../../middlewares/authMiddleware');
const categoryController = require('../../controllers/dashboard/categoryController');

router.post('/category-add', authMiddleware, categoryController.add_category); // Ruta para agregar una categoría
router.get('/category-get', authMiddleware, categoryController.get_category); // Ruta para obtener categorías
router.delete('/category-delete/:categoryId', authMiddleware, categoryController.delete_category); // Ruta para eliminar una categoría

module.exports = router;
