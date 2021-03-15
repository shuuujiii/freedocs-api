const Article = require('../models/articleModel')
const User = require('../models/userModel')

module.exports = {
    create: async (req, res, next) => {
        try {
            const { title, url, tags } = req.body
            const tag_ids = tags.map(tag => tag._id)
            const user = await User.findById(req.decoded.user_id)
            const article = await Article.create({
                title: title,
                url: url,
                tags: tag_ids,
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
            }).populate('tags')
            res.json(articles)
        } catch (e) {
            next(e)
        }
    },
    update: async (req, res, next) => {
        try {
            const { _id, title, url, tags } = req.body
            const tag_ids = tags.map(tag => tag._id)
            const user = await User.findById(req.decoded.user_id)
            const article = await Article.findOneAndUpdate({
                _id: _id,
                user: user._id
            }, {
                title: title,
                url: url,
                tags: tag_ids
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
    },
    addTags: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user_id)
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
            const user = await User.findById(req.decoded.user_id)
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
            const user = await User.findById(req.decoded.user_id)
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