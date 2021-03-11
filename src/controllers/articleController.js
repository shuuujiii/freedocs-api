const Article = require('../models/articleModel')
const User = require('../models/userModel')
// const ArticleValidator = require('./articleValidator')
// const { AppError } = require('../appError')
// const { StatusCodes } = require('http-status-codes')

module.exports = {
    create: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user_id)
            const article = await Article.create({
                title: req.body.title,
                url: req.body.url,
                user: user._id,
            })
            res.json(article)
        } catch (e) {
            next(e)
        }
    },
    read: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user_id)
            const articles = await Article.find({
                user: user._id
            })
            res.json(articles)
        } catch (e) {
            next(e)
        }
    },
    update: async (req, res, next) => {
        try {
            const { _id, title, url } = req.body
            const user = await User.findById(req.decoded.user_id)
            const article = await Article.findOneAndUpdate({
                _id: _id,
                user: user._id
            }, {
                title: title,
                url: url,
            }, {
                new: true,
            })
            res.json(article)
        } catch (e) {
            next(e)
        }
    },
    delete: async (req, res, next) => {
        try {
            const { _id } = req.body
            const user = await User.findById(req.decoded.user_id)
            const article = await Article.deleteOne({
                _id: _id,
                user: user._id
            })
            res.json(article)
        } catch (e) {
            next(e)
        }
    }
}