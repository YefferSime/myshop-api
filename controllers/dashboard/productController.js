const formidable = require('formidable');
const cloudinary = require('cloudinary').v2;
const productModel = require('../../models/productModel');
const { responseReturn } = require('../../utiles/response');

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
    secure: true,
});

class ProductController {
    // Método para agregar productos con imágenes en Cloudinary
    add_product = async (req, res) => {
        const { id } = req; // ID del vendedor (suponiendo que viene de un middleware)
        const form = formidable({ multiples: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: 'Error al procesar el formulario' });
            }

            let { name, category, description, stock, price, discount, shopName, brand } = fields;
            const { images } = files;

            name = name.trim();
            const slug = name.split(' ').join('-');
            const allImageUrl = [];

            try {
                // Subir imágenes a Cloudinary
                const imageFiles = Array.isArray(images) ? images : [images]; // Manejo de múltiples imágenes
                for (const image of imageFiles) {
                    const result = await cloudinary.uploader.upload(image.filepath, { folder: 'products' });
                    allImageUrl.push(result.url);
                }

                // Crear el producto en la base de datos
                await productModel.create({
                    sellerId: id,
                    name,
                    slug,
                    shopName: shopName.trim(),
                    category: category.trim(),
                    description: description.trim(),
                    stock: parseInt(stock),
                    price: parseInt(price),
                    discount: parseInt(discount),
                    images: allImageUrl, // Guardar URLs de imágenes
                    brand: brand.trim(),
                });

                responseReturn(res, 201, { message: 'Producto agregado exitosamente' });
            } catch (error) {
                responseReturn(res, 500, { error: error.message });
            }
        });
    };

    // Obtener productos (con paginación y búsqueda)
    products_get = async (req, res) => {
        const { page, searchValue, parPage } = req.query;
        const { id } = req; // ID del vendedor
        const skipPage = parseInt(parPage) * (parseInt(page) - 1);

        try {
            const query = { sellerId: id };
            if (searchValue) {
                query.$text = { $search: searchValue };
            }

            const products = await productModel
                .find(query)
                .skip(skipPage)
                .limit(parseInt(parPage))
                .sort({ createdAt: -1 });

            const totalProduct = await productModel.countDocuments(query);
            responseReturn(res, 200, { totalProduct, products });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    // Obtener un producto por su ID
    product_get = async (req, res) => {
        const { productId } = req.params;
        try {
            const product = await productModel.findById(productId);
            responseReturn(res, 200, { product });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    // Actualizar un producto
    product_update = async (req, res) => {
        const { name, description, discount, price, brand, productId, stock } = req.body;
        const slug = name.trim().split(' ').join('-');

        try {
            const updatedProduct = await productModel.findByIdAndUpdate(
                productId,
                { name, description, discount, price, brand, stock, slug },
                { new: true } // Devolver el producto actualizado
            );
            responseReturn(res, 200, { product: updatedProduct, message: 'Producto actualizado exitosamente' });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };

    // Actualizar imágenes de un producto
    product_image_update = async (req, res) => {
        const form = formidable();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: 'Error al procesar el formulario' });
            }

            const { productId, oldImage } = fields;
            const { newImage } = files;

            try {
                // Subir nueva imagen a Cloudinary
                const result = await cloudinary.uploader.upload(newImage.filepath, { folder: 'products' });

                // Actualizar la URL en la base de datos
                const product = await productModel.findById(productId);
                const imageIndex = product.images.findIndex((img) => img === oldImage);

                if (imageIndex !== -1) {
                    product.images[imageIndex] = result.url;
                    await product.save();

                    responseReturn(res, 200, { product, message: 'Imagen del producto actualizada exitosamente' });
                } else {
                    responseReturn(res, 404, { error: 'Imagen anterior no encontrada' });
                }
            } catch (error) {
                responseReturn(res, 500, { error: error.message });
            }
        });
    };

    // Eliminar un producto
    delete_product = async (req, res) => {
        const { productId } = req.params;
        try {
            await productModel.findByIdAndDelete(productId);
            responseReturn(res, 200, { message: 'Producto eliminado exitosamente' });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };
}

module.exports = new ProductController();
