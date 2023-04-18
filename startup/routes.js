const express = require('express');
const products = require('../routes/products.js');
const users = require('../routes/users.js');
const auth = require('../routes/auth.js');

module.exports = async function(app) {
    app.use(express.json());
    app.use('/api/products', products);
    app.use('/api/users', users);
    app.use('/api/auth', auth);
}
