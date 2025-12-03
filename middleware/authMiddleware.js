const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
        console.log('Token found in header');
    } else if (req.cookies && req.cookies.token) {
        // Set token from cookie
        token = req.cookies.token;
        console.log('Token found in cookie');
    } else {
        console.log('No token found in header or cookie');
        console.log('Cookies:', req.cookies);
        console.log('Headers:', req.headers.authorization);
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id);

        next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
};
