
var express = require('express')
var router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const User = mongoose.model('User')
const jwt = require('jsonwebtoken');

router.get('/', function (req, res) {
    const { username, password } = req.body;
    let result = {};
    let status = 200;
    User.findOne({ username }, (err, user) => {
        if (!err && user) {
            // We could compare passwords in our model instead of below
            bcrypt.compare(password, user.password).then(match => {
                if (match) {
                    status = 200;

                    const payload = { user: user.username };
                    const options = { expiresIn: '2d', issuer: 'https://scotch.io' };
                    const secret = process.env.JWT_SECRET;
                    const token = jwt.sign(payload, secret, options);

                    // console.log('TOKEN', token);
                    result.token = token;
                    result.status = status;
                    result.result = user;
                } else {
                    status = 401;
                    result.status = status;
                    result.error = 'Authentication error';
                }
                res.status(status).send(result);
            }).catch(err => {
                status = 500;
                result.status = status;
                result.error = err;
                res.status(status).send(result);
            });
        } else {
            status = 404;
            result.status = status;
            result.error = err;
            res.status(status).send(result);
        }
    });

    //res.json({ "message": "login" })
})

module.exports = router