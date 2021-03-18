const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const { AppError } = require('../utils/appError')

module.exports = {
    create: async (req, res, next) => {
        try {
            const { url, tags } = req.body
            const user = await User.findById(req.decoded.user._id)
            const article = await Article.create({
                url: url,
                tags: tags,
                user: user._id,
            })
            const populated = await Article.findById(article._id).populate('tags')
            res.json(populated)
        } catch (e) {
            next(e)
        }
    },
    read: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const articles = await Article.find({
                user: user._id
            }).populate('tags')
            res.json(articles)
        } catch (e) {
            next(e)
        }
    },
    update: async (req, res, next) => {
        try {
            const { _id, url, tags } = req.body
            const user = await User.findById(req.decoded.user._id)
            const article = await Article.findOneAndUpdate({
                _id: _id,
                user: user._id
            }, {
                url: url,
                tags: tags
            }, {
                new: true,
            })
            if (!article) {
                throw new AppError('AppError', StatusCodes.NO_CONTENT, 'there is no article on this request', true)
            }
            const populated = await Article.findById(article._id).populate('tags')
            res.json(populated)
        } catch (e) {
            next(e)
        }
    },
    delete: async (req, res, next) => {
        try {
            const { _id } = req.body
            const user = await User.findById(req.decoded.user._id)
            const article = await Article.deleteOne({
                _id: _id,
                user: user._id
            })
            res.json(article)
        } catch (e) {
            next(e)
        }
    },
    addTags: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id, tags } = req.body
            const tag_ids = tags.map(tag => tag._id)
            const article = await Article.findOneAndUpdate(
                { _id: _id, user: user._id },
                { $addToSet: { tags: tag_ids } },
                { new: true })
            res.json(article)

        } catch (e) {
            next(e)
        }
    },
    deleteTags: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id, tags } = req.body
            const tag_ids = tags.map(tag => tag._id)
            const article = await Article.findOneAndUpdate(
                { _id: _id, user: user._id },
                { $pullAll: { tags: tag_ids } },
                { new: true }
            )
            res.json(article)
        } catch (e) {
            next(e)
        }
    },
    updateTag: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id, tags } = req.body
            const tag_ids = tags.map(tag => tag._id)
            const article = await Article.findOneAndUpdate(
                { _id: _id, user: user._id },
                { tags: tag_ids },
                { new: true }
            )
            res.json(article)
        } catch (e) {
            next(e)
        }
    }
}