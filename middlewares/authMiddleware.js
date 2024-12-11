const jwt = require('jsonwebtoken');

module.exports.authMiddleware = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        console.log('Authorization header is missing');
        return res.status(401).json({ error: 'Authorization header is missing' });
    }

    const token = authorization.split(' ')[1];
    if (!token) {
        console.log('Token is missing');
        return res.status(401).json({ error: 'Token is missing. Please login first.' });
    }

    try {
        const deCodeToken = await jwt.verify(token, process.env.SECRET);
        req.role = deCodeToken.role;
        req.id = deCodeToken.id;
        next();
    } catch (error) {
        console.log('Invalid or expired token');
        return res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
    }
};
