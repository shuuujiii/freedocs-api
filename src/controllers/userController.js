const User = require('../models/userModel')
const UserValidator = require('../middlewares/validator/userValidator')
const bcrypt = require('bcrypt');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const { AppError } = require('../utils/appError')
const environment = process.env.NODE_ENV;
const stage = require('../configs/config.js')[environment];
const jwt = require('jsonwebtoken')

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
            // check authenticate user
            if (req.decoded.username !== req.query.username) {
                throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED, 'not authorized', true)
            }

            // find user
            const user = await User.findOne({
                username: req.query.username
            })

            // check user exist
            if (user === null) {
                throw new AppError(getReasonPhrase(StatusCodes.NOT_FOUND), StatusCodes.NOT_FOUND, 'user not found', true)
            }

            // response
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
    },
    login: async (req, res, next) => {
        try {
            const { username, password } = req.body;
            // find user
            const user = await User.findOne({ username: username })
                .catch(err => {
                    throw new AppError('internal server error', StatusCodes.INTERNAL_SERVER_ERROR, 'internal server error', true)
                })

            // is exist user
            if (user === null) {
                throw new AppError('not found', StatusCodes.NOT_FOUND, 'user is not found', true)
            }

            // compare password
            const match = await bcrypt.compare(password, user.password)
            if (!match) {
                throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED, 'password not matched', true)
            }

            // authenticated
            const payload = {
                user_id: user._id,
                username: user.username,
            }
            const options = {
                expiresIn: '2d',
                issuer: 'shuji watanabe'
            }
            res.json({
                payload: payload,
                options: options,
                token: jwt.sign(payload, process.env.JWT_SECRET, options)
            })

        } catch (e) {
            next(e)
        }
    }
}