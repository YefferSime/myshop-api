const cardModel = require('../../models/cardModel');
const wishlistModel = require('../../models/wishlistModel');
const { responseReturn } = require('../../utiles/response');
const { mongo: { ObjectId } } = require('mongoose');

class cardController {
    
    // Agregar producto al carrito
    add_to_card = async (req, res) => {
        const { userId, productId, quantity } = req.body;
        try {
            const product = await cardModel.findOne({
                $and: [
                    { productId: { $eq: productId } },
                    { userId: { $eq: userId } }
                ]
            });

            if (product) {
                return responseReturn(res, 404, { error: 'Producto ya agregado al carrito' });
            }

            const newProduct = await cardModel.create({ userId, productId, quantity });
            return responseReturn(res, 201, { message: 'Añadido al carrito con éxito', product: newProduct });

        } catch (error) {
            console.log(error.message);
            return responseReturn(res, 500, { error: 'Internal server error' });
        }
    };

    // Obtener productos del carrito
    get_card_products = async (req, res) => {
        const { userId } = req.params;
        const discountRate = 5;

        try {
            // Obtiene los productos en el carrito del usuario
            const card_products = await cardModel.aggregate([
                { $match: { userId: { $eq: new ObjectId(userId) } } },
                { 
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'products'
                    }
                }
            ]);

            let totalPrice = 0;
            let buy_product_item = 0;
            let card_product_count = 0;

            const outOfStockProduct = card_products.filter(p => p.products[0]?.stock < p.quantity);
            outOfStockProduct.forEach(item => {
                card_product_count += item.quantity;
            });

            const stockProduct = card_products.filter(p => p.products[0]?.stock >= p.quantity);
            stockProduct.forEach(item => {
                const { quantity } = item;
                card_product_count += quantity;
                buy_product_item += quantity;

                const { price, discount } = item.products[0];
                const finalPrice = discount !== 0 ? (price - Math.floor((price * discount) / 100)) : price;
                totalPrice += quantity * finalPrice;
            });

            // Agrupación por vendedor
            let groupedProducts = [];
            let uniqueSellers = [...new Set(stockProduct.map(p => p.products[0]?.sellerId.toString()))];

            uniqueSellers.forEach(sellerId => {
                let sellerProducts = stockProduct.filter(p => p.products[0]?.sellerId.toString() === sellerId);
                let sellerPrice = 0;

                let products = sellerProducts.map(item => {
                    const { price, discount, shopName } = item.products[0];
                    const discountedPrice = discount !== 0 ? (price - Math.floor((price * discount) / 100)) : price;
                    const finalPrice = discountedPrice - Math.floor((discountedPrice * discountRate) / 100);
                    sellerPrice += finalPrice * item.quantity;

                    return {
                        _id: item._id,
                        quantity: item.quantity,
                        productInfo: item.products[0]
                    };
                });

                groupedProducts.push({
                    sellerId,
                    shopName: sellerProducts[0].products[0].shopName,
                    price: sellerPrice,
                    products
                });
            });

            // Cálculo del shipping_fee basado en el número de vendedores
            const shipping_fee = 1* uniqueSellers.length; // Ejemplo de tarifa de $10 por vendedor

            responseReturn(res, 200, {
                card_products: groupedProducts,
                price: totalPrice,
                card_product_count,
                shipping_fee,
                outOfStockProduct,
                buy_product_item
            });

        } catch (error) {
            console.log(error.message);
            return responseReturn(res, 500, { error: 'Error Interno del Servidor' });
        }
    };

    // Eliminar producto del carrito
    delete_card_product = async (req, res) => {
        const { card_id } = req.params;
        try {
            await cardModel.findByIdAndDelete(card_id);
            responseReturn(res, 200, { message: 'Producto eliminado del carrito' });
        } catch (error) {
            console.log(error.message);
            return responseReturn(res, 500, { error: 'Error Interno del Servidor' });
        }
    };

    // Incrementar cantidad de producto en el carrito
    quantity_inc = async (req, res) => {
        const { card_id } = req.params;
        try {
            const product = await cardModel.findById(card_id);
            if (product) {
                const newQuantity = product.quantity + 1;
                await cardModel.findByIdAndUpdate(card_id, { quantity: newQuantity });
                responseReturn(res, 200, { message: 'Cantidad aumentada' });
            } else {
                responseReturn(res, 404, { error: 'Producto no encontrado' });
            }
        } catch (error) {
            console.log(error.message);
            return responseReturn(res, 500, { error: 'Internal server error' });
        }
    };

    // Decrementar cantidad de producto en el carrito
    quantity_dec = async (req, res) => {
        const { card_id } = req.params;
        try {
            const product = await cardModel.findById(card_id);
            if (product && product.quantity > 1) {
                const newQuantity = product.quantity - 1;
                await cardModel.findByIdAndUpdate(card_id, { quantity: newQuantity });
                responseReturn(res, 200, { message: 'Cantidad disminuida' });
            } else {
                responseReturn(res, 404, { error: 'Producto no encontrado o la cantidad ya es 1' });
            }
        } catch (error) {
            console.log(error.message);
            return responseReturn(res, 500, { error: 'Internal server error' });
        }
    };

    // Agregar producto a la wishlist
    add_wishlist = async (req, res) => {
        const { slug } = req.body;
        try {
            const product = await wishlistModel.findOne({ slug });
            if (product) {
                responseReturn(res, 404, { error: 'Ya agregado a la lista de deseos' });
            } else {
                await wishlistModel.create(req.body);
                responseReturn(res, 201, { message: 'Añadido a la lista de deseos' });
            }
        } catch (error) {
            console.log(error.message);
            return responseReturn(res, 500, { error: 'Internal server error' });
        }
    };

    // Obtener productos de la wishlist
    get_wishlist = async (req, res) => {
        const { userId } = req.params;
        try {
            const wishlists = await wishlistModel.find({ userId });
            responseReturn(res, 200, { wishlistCount: wishlists.length, wishlists });
        } catch (error) {
            console.log(error.message);
            return responseReturn(res, 500, { error: 'Internal server error' });
        }
    };

    // Eliminar producto de la wishlist
    delete_wishlist = async (req, res) => {
        const { wishlistId } = req.params;
        try {
            const wishlist = await wishlistModel.findByIdAndDelete(wishlistId);
            responseReturn(res, 200, { message: 'Eliminado de la lista de deseos', wishlistId });
        } catch (error) {
            console.log(error.message);
            return responseReturn(res, 500, { error: 'Internal server error' });
        }
    };
}

module.exports = new cardController();
