const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET; // use the env var here

module.exports = function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token required' });

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // Attach user info to request
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};
