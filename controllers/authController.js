const User = require('../models/User');
const jwt = require('jsonwebtoken');

// handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { email: '', password: '' };

    // incorrect email
    if (err.message.includes('incorrect email')) {
        errors.email = 'That email is not registered';
    }

    // incorrect password
    if (err.message.includes('incorrect password')) {
        errors.password = 'That password is incorrect';
    }

    // duplicate error code
    if (err.code === 11000) {
        errors.email = 'That email is already registered';
        return errors;
    }

    // validation errors
    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
};

const maxAge = 3 * 24 * 60 * 60; // 3 days
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: maxAge,
    });
};

// module.exports.signup_get = (req, res) => {
//     res.sendFile(path.join(__dirname, 'public/pages', 'signup.html'));
// };

// module.exports.login_get = (req, res) => {
//     res.sendFile(path.join(__dirname, 'public/pages', 'login.html'));
// };

module.exports.signup_post = async (req, res) => {
    const { email, password } = req.body;

    res.cookie('jwt', '', { maxAge: 1 }); // Clear the JWT cookie
    res.cookie('username', '', { maxAge: 1 }); // Clear the username cookie

    try {
        const user = await User.create({ email, password });
        const token = createToken(user._id);
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: maxAge * 1000,
            // secure: process.env.NODE_ENV === 'production', // Uncomment this when deploying in production
        });
        res.cookie('username', email.split('@')[0], {
            maxAge: maxAge * 1000,
            // secure: process.env.NODE_ENV === 'production', // Uncomment when deploying to production
        })
        res.status(201).json({ user: user._id });
    } catch (error) {
        const errors = handleErrors(error);
        res.status(400).json({ errors });
    }
};

module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.login(email, password); // Ensure this method exists in your User model
        const token = createToken(user._id);
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: maxAge * 1000,
            // secure: process.env.NODE_ENV === 'production', // Uncomment when deploying to production
        });
        res.cookie('username', email.split('@')[0], {
            maxAge: maxAge * 1000,
            // secure: process.env.NODE_ENV === 'production', // Uncomment when deploying to production
        })
        res.status(200).json({ user: user._id });
    } catch (error) {
        const errors = handleErrors(error);
        res.status(400).json({ errors });
    }
};

module.exports.logout_post = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 }); // Clear the JWT cookie
    res.cookie('username', '', { maxAge: 1 }); // Clear the username cookie
    res.status(200).send('Logged out successfully'); // Send response back to client
};
