module.exports = function requireRole(role) {
    return function (req, res, next) {
        if (req.user.userType !== role) {
            return res.status(403).json({ message: 'Access denied: Insufficient role' });
        }
        next();
    };
};
