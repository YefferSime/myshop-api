const authorOrder = require('../../models/authOrder')
const customerOrder = require('../../models/customerOrder')
const sellerWallet = require('../../models/sellerWallet')
const myShopWallet = require('../../models/myShopWallet')
const sellerModel = require('../../models/sellerModel')

const adminSellerMessage = require('../../models/chat/adminSellerMessage')
const sellerCustomerMessage = require('../../models/chat/sellerCustomerMessage')
const productModel = require('../../models/productModel')

const { mongo: { ObjectId } } = require('mongoose')
const { responseReturn } = require('../../utiles/response')

module.exports.get_seller_dashboard_data = async (req, res) => {
    const { id } = req;

    try {
        const totalSele = await sellerWallet.aggregate([
            {
                $match: {
                    sellerId: {
                        $eq: id
                    }
                }
            }, {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ])

        const totalProduct = await productModel.find({
            sellerId: new ObjectId(id)
        }).countDocuments()

        const totalOrder = await authorOrder.find({
            sellerId: new ObjectId(id)
        }).countDocuments()

        const totalPendingOrder = await authorOrder.find({
            $and: [
                {
                    sellerId: {
                        $eq: new ObjectId(id)
                    }
                },
                {
                    delivery_status: {
                        $eq: 'pending'
                    }
                }
            ]
        }).countDocuments()

        const messages = await sellerCustomerMessage.find({
            $or: [
                {
                    senderId: {
                        $eq: id
                    }
                },
                {
                    receverId: {
                        $eq: id
                    }
                }
            ]
        }).limit(3)

        const recentOrders = await authorOrder.find({
            sellerId: new ObjectId(id)
        }).limit(5)

        responseReturn(res, 200, {
            totalOrder,
            totalSale: totalSele.length > 0 ? totalSele[0].totalAmount : 0,
            totalPendingOrder,
            messages,
            recentOrders,
            totalProduct
        })
    } catch (error) {
        console.log('get seller dashboard data error ' + error.messages)
    }
}

module.exports.get_admin_dashboard_data = async (req, res) => {
    try {
        // Obtener la suma total de ventas
        const totalSele = await myShopWallet.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Contar productos, órdenes y vendedores
        const totalProduct = await productModel.find({}).countDocuments();
        const totalOrder = await customerOrder.find({}).countDocuments();
        const totalSeller = await sellerModel.find({}).countDocuments();

        // Obtener mensajes recientes
        const messages = await adminSellerMessage.find({}).limit(3);

        // Obtener órdenes recientes con nombre de la tienda
        const recentOrders = await customerOrder.aggregate([
            {
                $unwind: '$products', // Descomponer el array de productos
            },
            {
                $lookup: {
                    from: 'sellers', // Nombre de la colección de vendedores (si es necesario vincular más datos)
                    localField: 'products.sellerId',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            {
                $project: {
                    price: 1,
                    date: 1,
                    'shippingInfo.name': 1,
                    shopName: '$products.shopName', // Extraer el nombre de la tienda
                }
            },
            { $sort: { createdAt: -1 } }, // Ordenar por la fecha más reciente
            { $limit: 5 } // Limitar a 5 órdenes recientes
        ]);

        // Responder con los datos del dashboard
        responseReturn(res, 200, {
            totalOrder,
            totalSale: totalSele.length > 0 ? totalSele[0].totalAmount : 0,
            totalSeller,
            messages,
            recentOrders,
            totalProduct
        });
    } catch (error) {
        console.log('get admin dashboard data error ' + error.message);
    }
};
