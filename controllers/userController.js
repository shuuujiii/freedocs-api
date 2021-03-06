const mongoose = require('mongoose')
const validateToken = require('../utils/jwtvalidation').validateToken;
const User = mongoose.model('User')
const httpCode = require('../utils/httpcode')
const bcrypt = require('bcrypt');

const environment = process.env.NODE_ENV;
const stage = require('../config.js')[environment];
// const hashPassword = require('../utils/bcrypto').hashPassword
module.exports = {
    create: async (req, res) => {
        const { username, password } = req.body
        // let status = httpCode.SuccessOK;
        const findUser = await User.findOne({ username: username }).lean()
        if (findUser) {
            res.json('find')
        } else {
            const user = await User.create({
                username: username,
                password: bcrypt.hashSync(password, stage.saltingRounds),
            })
            res.json(user)
        }
    },
    read: async (req, res) => {
        const user = await User.findOne({
            'username': req.query.username
        })
        res.json(user)
    }
}