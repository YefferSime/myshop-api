const customerModel = require('../../models/customerModel')
const { responseReturn } = require('../../utiles/response')
const { createToken } = require('../../utiles/tokenCreate')
const sellerCustomerModel = require('../../models/chat/sellerCustomerModel')
const bcrypt = require('bcrypt')
class customerAuthController {
    customer_register = async (req, res) => {
        const { name, email, password } = req.body

        try {
            const customer = await customerModel.findOne({ email })
            if (customer) {
                responseReturn(res, 404, { error: 'Este correo ya existe' })
            } else {
                const createCustomer = await customerModel.create({
                    name: name.trim(),
                    email: email.trim(),
                    password: await bcrypt.hash(password, 10),
                    method: 'menualy'
                })
                await sellerCustomerModel.create({
                    myId: createCustomer.id
                })
                const token = await createToken({
                    id: createCustomer.id,
                    name: createCustomer.name,
                    email: createCustomer.email,
                    method: createCustomer.method
                })
                res.cookie('customerToken', token, {
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                })
                responseReturn(res, 201, { message: 'Registro exitoso', token })
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    customer_login = async (req, res) => {
        const { email, password } = req.body
        try {
            const customer = await customerModel.findOne({ email }).select('+password')
            if (customer) {
                const match = await bcrypt.compare(password, customer.password)
                if (match) {
                    const token = await createToken({
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                        method: customer.method
                    })
                    res.cookie('customerToken', token, {
                        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    })
                    responseReturn(res, 201, { message: 'Se inicio sesión', token })
                } else {
                    responseReturn(res, 404, { error: "Contraseña Incorrecta" })
                }
            } else {
                responseReturn(res, 404, { error: 'Correo no encontrado' })
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    customer_logout = async(req,res)=>{
        res.cookie('customerToken',"",{
            expires : new Date(Date.now())
        })
        responseReturn(res,200,{message : 'Se cerro la sesión'})
    }
}

module.exports = new customerAuthController()