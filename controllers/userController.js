const mongoose = require('mongoose')
const validateToken = require('../utils/jwtvalidation').validateToken;
const User = mongoose.model('User')
const bcrypt = require('bcrypt');
const { StatusCodes } = require('http-status-codes');
const environment = process.env.NODE_ENV;
const stage = require('../config.js')[environment];
module.exports = {
    create: async (req, res) => {
        const { username, password } = req.body
        const findUser = await User.findOne({ username: username }).lean()
        if (findUser) {
            res.status(StatusCodes.CONFLICT)
                .json('user already exists')
        } else {
            const user = await User.create({
                username: username,
                password: bcrypt.hashSync(password, stage.saltingRounds),
            })
            res.status(StatusCodes.CREATED)
                .json(user)
        }
    },
    read: async (req, res) => {
        const user = await User.findOne({
            'username': req.query.username
        })
        console.log('judgement', user === null)
        if (user === null) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'user not found' })
        } else {
            res.json(user)
        }
    },
    update: async (req, res) => {
        const { username, admin } = req.body
        if (typeof admin !== 'boolean') {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'invalid parameter' })
            return
        }
        const user = await User.findOneAndUpdate(
            { username: username },
            { admin: admin },
            { new: true })
        res.json(user)
    },
    delete: async (req, res) => {
        const { username } = req.body
        const user = await User.deleteOne({ 'username': username })
        res.json(user)
    }
}