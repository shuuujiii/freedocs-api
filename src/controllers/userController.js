const User = require('../models/userModel');
const Article = require('../models/articleModel');
const Tag = require('../models/tagModel');
const UserValidator = require('../middlewares/validator/userValidator');
const bcrypt = require('bcrypt');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const { AppError } = require('../utils/appError');
const environment = process.env.NODE_ENV;
const stage = require('../configs/config.js')[environment];
const jwt = require('jsonwebtoken');

module.exports = {
    create: async (req, res, next) => {
        try {
            const { username, password } = req.body
            // validate parameter
            await UserValidator.validateAsync({ username: username, password: password })
                .catch(err => {
                    throw new AppError(err.name, StatusCodes.BAD_REQUEST, err.message, true)
                });

            // check duplicate
            const findUser = await User.findOne({ username: username }).lean()
            if (findUser) {
                throw new AppError('AppError', StatusCodes.CONFLICT, 'user already exists', true)
            }

            // create user
            const user = await User.create({
                username: username,
                password: bcrypt.hashSync(password, stage.saltingRounds),
            })

            // authenticated
            const payload = {
                user: user
            }
            const options = {
                expiresIn: '2d',
                issuer: 'shuji watanabe'
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, options)
            // res.cookie('token', token, { httpOnly: true });
            req.session.token = token;
            req.session.user = user;

            res.status(StatusCodes.CREATED)
                .json({ username: user.username })
        } catch (e) {
            next(e)
        }
    },
    read: async (req, res, next) => {
        try {
            // check authenticate user
            // if (req.decoded.user.username !== req.query.username) {
            //     throw new AppError('AppError', StatusCodes.UNAUTHORIZED, 'not authorized', true)
            // }

            // find user
            const user = await User.findOne({
                username: req.decoded.user.username
            })

            // check user exist
            if (user === null) {
                throw new AppError('AppError', StatusCodes.NOT_FOUND, 'user not found', true)
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
        const user = await User.findById(req.decoded.user._id)
        console.log(req.decoded)
        if (!user) {
            throw new AppError('AppError', StatusCodes.NO_CONTENT, 'user not found', true)
        }
        const deleteArticles = await Article.deleteMany({ user: user._id })
        // const deleteTags = await Tag.deleteMany()
        const deleteUser = await User.deleteOne({ _id: user._id })
        // const user = await User.deleteOne({ 'username': username })
        req.session.token = null;
        res.status(StatusCodes.OK).json({ message: 'successfully delete user' })
    },
    login: async (req, res, next) => {
        try {
            const { username, password } = req.body;
            // find user
            const user = await User.findOne({ username: username })
                .catch(err => {
                    throw new AppError('AppError', StatusCodes.INTERNAL_SERVER_ERROR, 'internal server error', true)
                })

            // is exist user
            if (user === null) {
                throw new AppError('AppError', StatusCodes.NOT_FOUND, 'user is not found', true)
            }

            // compare password
            const match = await bcrypt.compare(password, user.password)
            if (!match) {
                throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED, 'password not matched', true)
            }

            // authenticated
            const payload = {
                user: user
            }
            const options = {
                expiresIn: '2d',
                issuer: 'shuji watanabe'
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, options)
            // res.cookie('token', token, { httpOnly: true });
            req.session.token = token;
            req.session.user = user
            res.json({
                payload: payload,
                options: options,
                token: token
            })

        } catch (e) {
            next(e)
        }
    },
    authenticate: async (req, res, next) => {
        const payload = {
            user: req.session.user
        }
        const options = {
            expiresIn: '2d',
            issuer: 'shuji watanabe'
        }
        req.session.token = jwt.sign(payload, process.env.JWT_SECRET, options)
        res.json('authenticated')
    }
}