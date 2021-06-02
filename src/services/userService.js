const User = require('../models/userModel')
const Article = require('../models/articleModel');
const Comment = require('../models/commentModel')
const bcrypt = require('bcrypt');
const Joi = require('joi')
const environment = process.env.NODE_ENV;
const stage = require('../configs/config.js')[environment];
const { AppError } = require('../utils/appError');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');

// find
const findUserById = async (id) => {
    const user = await User.findById(id)
    if (!user) {
        throw new AppError('AppError', StatusCodes.NO_CONTENT, 'user not found', true)
    }
    return user
}
const findUserByUsername = async (username) => {
    const user = await User.findOne({ username: username })
    if (user === null) {
        throw new AppError('AppError', StatusCodes.NO_CONTENT, 'user is not found', true)
    }
    return user
}
const findUserWithAuthEmail = async (email) => {
    const user = await User.findOne({ email: email, authEmail: true })
    if (user === null) {
        throw new AppError('AppError', StatusCodes.NO_CONTENT, 'email is not found or authorized', true)
    }
    return user
}

// check
const checkUsernameDuplicated = async (username) => {
    const findUser = await User.findOne({ username: username }).lean()
    if (findUser) {
        throw new AppError('AppError', StatusCodes.CONFLICT, 'user already exists', true)
    }
    return
}

const comparePassword = async (inputPassword, storedPassword) => {
    const match = await bcrypt.compare(inputPassword, storedPassword)

    if (!match) {
        throw new AppError(getReasonPhrase(StatusCodes.UNAUTHORIZED), StatusCodes.UNAUTHORIZED, 'password not matched', true)
    }
    return
}

// validation
const createUserValidation = async (username, password, email) => {
    const UserValidator = Joi.object().keys({
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().regex(/^[a-zA-Z0-9]{8,30}$/),
        email: Joi.string().email().allow(''),
        admin: Joi.boolean(),
    }).with('username', 'password')
    await UserValidator.validateAsync({ username: username, password: password, email: email })
        .catch(err => {
            throw new AppError(err.name, StatusCodes.BAD_REQUEST, err.message, true)
        });
    return
}
const updateUserValidation = async (update) => {
    const updateValidator = Joi.object().keys({
        username: Joi.string().alphanum().min(3).max(30),
        password: Joi.string().regex(/^[a-zA-Z0-9]{8,30}$/),
        email: Joi.string().email().allow(''),
        admin: Joi.boolean(),
        authEmail: Joi.boolean(),
    })
    await updateValidator.validateAsync(update)
        .catch(err => {
            throw new AppError(err.name, StatusCodes.BAD_REQUEST, err.message, true)
        });
    return
}
// update / create / delete
const createUser = async (username, password, email) => {
    const user = await User.create({
        username: username,
        password: bcrypt.hashSync(password, stage.saltingRounds),
        email: email,
    })
    return user
}
const findOneAndUpdateUser = async (_id, update) => {
    const user = await User.findOneAndUpdate(
        { _id: _id },
        update,
        { new: true })
    return user
}
const deleteUser = async (_id) => {
    const articles = await Article.find({ user: _id })

    await Comment.updateMany({ user: _id }, {
        user: null,
        comment: "*** comment deleted ***"
    })

    await Article.updateMany({
        $or: [
            { upvoteUsers: { $in: [_id] } },
            { downvoteUsers: { $in: [_id] } }
        ]
    },
        {
            $pull: { upvoteUsers: _id, downvoteUsers: _id },
        })
    await Article.updateMany({ favoriteUsers: { $in: [_id] } },
        { $pull: { favoriteUsers: _id } })
    await Article.deleteMany({ user: _id })
    await User.deleteOne({ _id: _id })
    return
}
// get data
const getProfile = async (username) => {
    const users = await User.aggregate([
        {
            $match: {
                username: username
            }
        },
        {
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
    return users[0]
}

const login = async (username, password) => {
    // compare password
    const user = await findUserByUsername(username)
    await comparePassword(password, user.password)
    return user
}

module.exports = {
    findUserById,
    findUserByUsername,
    findUserWithAuthEmail,
    checkUsernameDuplicated,
    comparePassword,
    createUserValidation,
    updateUserValidation,
    createUser,
    findOneAndUpdateUser,
    deleteUser,
    getProfile,
    login,
}