const User = require('../models/userModel');
const Article = require('../models/articleModel');
const Like = require('../models/likesModel')
const Vote = require('../models/voteModel')
const Comment = require('../models/commentModel')

const bcrypt = require('bcrypt');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const { AppError } = require('../utils/appError');
const environment = process.env.NODE_ENV;
const stage = require('../configs/config.js')[environment];
const jwt = require('jsonwebtoken');
const mail = require('../utils/sendMail')
const Joi = require('joi')
const UserValidator = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{8,30}$/),
    email: Joi.string().email().allow(''),
    admin: Joi.boolean(),
}).with('username', 'password')

const defaultOptions = {
    expiresIn: '2d',
    issuer: 'shuji watanabe'
}

const defaultEmailOptions = {
    expiresIn: '2d',
    issuer: 'shuji watanabe'
}

const createToken = (payload, options = defaultOptions) => {
    return jwt.sign(payload, process.env.JWT_SECRET, options)
}

const createEmailToken = (payload, options = defaultEmailOptions) => {
    return jwt.sign(payload, process.env.EMAIL_SECRET, options)
}

const getPayloadUser = (user) => {
    if (!user) return null;
    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        authEmail: user.authEmail,
        admin: user.admin,
    }
}
module.exports = {
    create: async (req, res, next) => {
        try {
            const { username, password, email } = req.body
            // validate parameter
            await UserValidator.validateAsync({ username: username, password: password, email: email })
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
                email: email,
                password: bcrypt.hashSync(password, stage.saltingRounds),
            })

            // authenticated
            const payload = { user: getPayloadUser(user) }

            const token = createToken(payload)
            req.session.token = token;
            // req.session.user = user;
            const emailtoken = createEmailToken(payload)
            mail.sendMail(user.username, email, emailtoken)
            res.status(StatusCodes.CREATED)
                .json(payload)
        } catch (e) {
            next(e)
        }
    },

    profile: async (req, res, next) => {
        try {
            const { username } = req.query
            const userdata = await User.aggregate([
                {
                    $match: {
                        username: username
                    }
                }, {
                    $lookup: {
                        from: "articles",
                        localField: '_id',
                        foreignField: 'user',
                        as: 'articles'
                    }
                },
                {
                    $project: {
                        "username": 1,
                        "posts": { $size: "$articles" }
                    }
                },
            ])
            res.json(userdata[0])
        } catch (e) {
            next(e)
        }
    },
    update: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { username, admin } = req.body
            if (!user) {
                throw new AppError('AppError', StatusCodes.NO_CONTENT, 'user not found', true)
            }

            if (typeof admin !== 'boolean') {
                res.status(StatusCodes.BAD_REQUEST).json({ message: 'invalid parameter' })
                return
            }

            // check duplicate
            const findUser = await User.findOne({ username: username }).lean()
            if (findUser) {
                throw new AppError('AppError', StatusCodes.CONFLICT, 'username already exists', true)
            }
            const updatedUser = await User.findOneAndUpdate(
                { _id: user._id },
                {
                    username: username,
                    admin: admin,
                },
                { new: true })
            console.log('updatedUer', updatedUser)
            console.log('payloadUser', getPayloadUser(updatedUser))
            res.json(getPayloadUser(updatedUser))
        } catch (e) {
            next(e)
        }

    },
    delete: async (req, res) => {
        const user = await User.findById(req.decoded.user._id)
        if (!user) {
            throw new AppError('AppError', StatusCodes.NO_CONTENT, 'user not found', true)
        }
        const articles = await Article.find({ user: user._id })

        const deleteLikeVote = async () => {
            for (article of articles) {
                await Like.deleteOne({ article: article._id })
                await Vote.deleteOne({ article: article._id })
            }
        }
        deleteLikeVote()

        await Comment.updateMany({ user: user._id }, {
            user: null,
            comment: "*** comment deleted ***"
        })
        await Like.updateMany({ users: { $in: [user._id] } },
            { $pull: { users: user._id } })
        await Vote.updateMany({ $or: [{ upvoteUsers: { $in: [user._id] } }, { downvoteUsers: { $in: [user._id] } }] },
            {
                $pull: { upvoteUsers: user._id, downvoteUsers: user._id },
            })
        await Article.deleteMany({ user: user._id })

        await User.deleteOne({ _id: user._id })
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
            const payload = { user: getPayloadUser(user) }
            const token = createToken(payload)
            req.session.token = token;
            // req.session.user = user;
            res.json(payload)

        } catch (e) {
            next(e)
        }
    },
    logout: async (req, res, next) => {
        req.session.destroy();
        res.clearCookie('connect.sid', { path: '/' }).status(StatusCodes.OK).json({ message: 'logout' })
    },
    silent: async (req, res, next) => {
        try {
            const payload = {
                user: req.decoded ? getPayloadUser(req.decoded.user) : null
            }
            const token = createToken(payload)
            req.session.token = token
            res.json({
                payload: payload,
            })
        } catch (e) {
            next(e)
        }
    },
    authEmail: async (req, res, next) => {

        try {
            const { token } = req.body
            const decoded = jwt.verify(token, process.env.EMAIL_SECRET, defaultEmailOptions)
            const updateUser = await User.findOneAndUpdate({ _id: decoded.user._id }, {
                authEmail: true
            }, { new: true })
            res.json({ message: 'email authenticated' })
        } catch (e) {
            next(e)
        }
    },
    changePassword: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { oldPassword, newPassword } = req.body;
            // find user
            if (user === null) {
                throw new AppError('AppError', StatusCodes.NOT_FOUND, 'user is not found', true)
            }

            // compare password
            const match = await bcrypt.compare(oldPassword, user.password)
            if (!match) {
                throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED, 'password not matched', true)
            }

            const update = await User.findOneAndUpdate({ _id: user._id }, { password: bcrypt.hashSync(newPassword, stage.saltingRounds) }, { new: true })
            // authenticated
            const payload = {
                user: getPayloadUser(update)
            }
            const token = createToken(payload)
            req.session.token = token;
            // req.session.user = user;
            res.json({
                message: 'password changed'
            })
        } catch (e) {
            next(e)
        }
    },
    changeEmail: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { email } = req.body;
            // find user
            if (user === null) {
                throw new AppError('AppError', StatusCodes.NOT_FOUND, 'user is not found', true)
            }

            const update = await User.findOneAndUpdate(
                { _id: user._id },
                { email: email, authEmail: false },
                { new: true })

            // authenticated
            const payload = {
                user: getPayloadUser(update)
            }
            const token = createToken(payload)
            req.session.token = token;
            // req.session.user = user;
            const emailtoken = createEmailToken(payload)
            mail.sendMail(update.username, email, emailtoken)
            res.json(payload)
        } catch (e) {
            next(e)
        }
    },
    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email: email, authEmail: true })
            // find user
            if (user === null) {
                throw new AppError('AppError', StatusCodes.NOT_FOUND, 'user is not found', true)
            }
            const payload = {
                user: getPayloadUser(user)
            }
            const emailtoken = createEmailToken(payload)
            mail.resetPasswordMail(user.username, email, emailtoken)
            res.json({ message: 'send email' })
        } catch (e) {
            next(e)
        }
    },
    resetPassword: async (req, res, next) => {
        try {
            const { token, password } = req.body
            const decoded = jwt.verify(token, process.env.EMAIL_SECRET, defaultOptions);
            const user = await User.findById(decoded.user._id)
            // find user
            if (user === null) {
                throw new AppError('AppError', StatusCodes.NOT_FOUND, 'user is not found', true)
            }

            const update = await User.findOneAndUpdate({ _id: user._id }, { password: bcrypt.hashSync(password, stage.saltingRounds) }, { new: true })
            // authenticated
            const payload = {
                user: getPayloadUser(update)
            }
            const newtoken = createToken(payload)
            req.session.token = newtoken;
            res.json({
                message: 'password changed'
            })
        } catch (e) {
            next(e)
        }
    },
}