const mongoose = require('mongoose')
const validateToken = require('../utils/jwtvalidation').validateToken;
const User = mongoose.model('User')
const UserValidator = require('../validation/userValidator')
const bcrypt = require('bcrypt');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const { AppError } = require('../appError')
const environment = process.env.NODE_ENV;
const stage = require('../config.js')[environment];
const Joi = require('joi');

module.exports = {
    create: async (req, res, next) => {
        try {
            const { username, password } = req.body

            // validate parameter
            await UserValidator.validateAsync({ username: username, password: password })
                .catch(err => {
                    throw new AppError('validation error', StatusCodes.BAD_REQUEST, err.message, true)
                });

            // check duplicate
            const findUser = await User.findOne({ username: username }).lean()
            if (findUser) {
                throw new AppError(getReasonPhrase(StatusCodes.CONFLICT), StatusCodes.CONFLICT, 'user already exists', true)
            }

            // create user
            const user = await User.create({
                username: username,
                password: bcrypt.hashSync(password, stage.saltingRounds),
            })
            res.status(StatusCodes.CREATED)
                .json({ username: user.username })
        } catch (e) {
            next(e)
        }
    },
    read: async (req, res, next) => {
        try {
            const user = await User.findOne({
                username: req.query.username
            })
            if (user === null) {
                throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND, 'user not found', true)
            }
            res.json({ username: user.username })
        } catch (e) {
            next(e)
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