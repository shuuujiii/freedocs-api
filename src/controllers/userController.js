const UserService = require('../services/userService')

const bcrypt = require('bcrypt');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const { AppError } = require('../utils/appError');
const environment = process.env.NODE_ENV;
const stage = require('../configs/config.js')[environment];
const jwt = require('jsonwebtoken');
const mail = require('../utils/sendMail')

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
            await UserService.checkUsernameDuplicated(username)
            await UserService.createUserValidation(username, password, email)
            const user = await UserService.createUser(username, password, email)
            // authenticated
            const payload = { user: getPayloadUser(user) }
            const token = createToken(payload)
            req.session.token = token;
            const emailtoken = createEmailToken(payload)
            mail.sendMail(user.username, email, emailtoken)
            res.status(StatusCodes.CREATED)
                .json(payload)
        } catch (e) {
            next(e)
        }
    },
    login: async (req, res, next) => {
        try {
            const { username, password } = req.body;
            const user = await UserService.login(username, password)
            const payload = { user: getPayloadUser(user) }
            const token = createToken(payload)
            req.session.token = token;
            res.json(payload)
        } catch (e) {
            next(e)
        }
    },
    update: async (req, res, next) => {
        try {
            const user = await UserService.findUserById(req.decoded.user._id)
            const { username, admin } = req.body
            const update = {
                username: username,
                admin: admin
            }
            await UserService.checkUsernameDuplicated(username)
            await UserService.updateUserValidation(update)
            const updatedUser = await UserService.findOneAndUpdateUser(user._id, update)
            res.json(getPayloadUser(updatedUser))
        } catch (e) {
            next(e)
        }

    },
    changePassword: async (req, res, next) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const user = await UserService.findUserById(req.decoded.user._id)
            await UserService.updateUserValidation({ password: newPassword })
            await UserService.comparePassword(oldPassword, user.password)
            const update = await UserService.findOneAndUpdateUser(user._id,
                { password: bcrypt.hashSync(newPassword, stage.saltingRounds) })
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
            const { email } = req.body;
            const user = await UserService.findUserById(req.decoded.user._id)
            const updateValue = { email: email, authEmail: false }
            await UserService.updateUserValidation(updateValue)
            const update = await UserService.findOneAndUpdateUser(user._id, updateValue)
            // authenticated
            const payload = {
                user: getPayloadUser(update)
            }
            const token = createToken(payload)
            req.session.token = token;
            const emailtoken = createEmailToken(payload)
            mail.sendMail(update.username, email, emailtoken)
            res.json(payload)
        } catch (e) {
            next(e)
        }
    },

    delete: async (req, res) => {
        try {
            const _id = req.decoded.user._id
            const user = await UserService.findUserById(_id)
            await UserService.deleteUser(user._id)
            req.session.token = null;
            res.status(StatusCodes.OK).json({ message: 'successfully delete user' })
        } catch (e) {
            next(e)
        }
    },
    logout: async (req, res, next) => {
        req.session.destroy();
        res.clearCookie('connect.sid', { path: '/' }).status(StatusCodes.OK).json({ message: 'logout' })
    },
    authEmail: async (req, res, next) => {
        try {
            const { token } = req.body
            const decoded = jwt.verify(token, process.env.EMAIL_SECRET, defaultEmailOptions)
            const updateUser = await UserService.findOneAndUpdateUser(decoded.user._id, { authEmail: true })
            res.json({ message: 'email authenticated' })
        } catch (e) {
            next(e)
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;
            const user = await UserService.findUserWithAuthEmail(email)
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
            const user = await UserService.findUserById(decoded.user._id)
            await UserService.updateUserValidation({ password: password })
            const update = await UserService.findOneAndUpdateUser(user._id, { password: bcrypt.hashSync(password, stage.saltingRounds) })
            // authenticated
            const payload = {
                user: getPayloadUser(update)
            }
            const newtoken = createToken(payload)
            req.session.token = newtoken;
            res.json({
                payload,
                message: 'password changed'
            })
        } catch (e) {
            next(e)
        }
    },
    profile: async (req, res, next) => {
        try {
            const { username } = req.query
            const user = await UserService.getProfile(username)
            res.status(StatusCodes.OK).json(user)
        } catch (e) {
            next(e)
        }
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

}