const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const { AppError } = require('../utils/appError')
const ObjectId = require('mongoose').Types.ObjectId;
const jwt = require('jsonwebtoken');

module.exports = {
    create: async (req, res, next) => {
        try {
            const { url, tags, description } = req.body
            const user = await User.findById(req.decoded.user._id)
            const article = await Article.create({
                url: url,
                description: description,
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
            const stages = [
                {
                    "$match": {
                        "user": user._id
                    }
                },
                {
                    "$lookup": {
                        "from": 'tags',
                        "localField": "tags",
                        "foreignField": "_id",
                        "as": "tags"
                    }
                },

            ]
            if (req.query.search) {
                let resampe = new RegExp(req.query.search, 'i');
                stages.push({
                    "$match": {
                        "$or": [
                            { "tags.name": { "$all": [resampe] } },
                            { "url": resampe },
                            { "description": resampe },
                        ]
                    }
                })
            }
            const articles = await Article.aggregate(stages)
            res.json(articles)
        } catch (e) {
            next(e)
        }
    },
    readall: async (req, res, next) => {
        const token = () => {
            if (req.session && req.session.token) { return req.session.token };
            const authorizationHeader = req.headers.authorization;
            if (!authorizationHeader) {
                return null
            }
            return req.headers.authorization.split(' ')[1]; // Bearer <token>)
        };
        const options = {
            expiresIn: '2d',
            issuer: 'shuji watanabe'
        };
        // verify makes sure that the token hasn't expired and has been issued by us
        let decoded = null
        try {
            decoded = jwt.verify(token(), process.env.JWT_SECRET, options);
        } catch {

        }
        let user_id = null
        if (decoded) {
            user_id = decoded.user._id
        }
        // const user_id = req.decoded && req.decoded.user && req.decoded.user._id || null
        // const user = await User.findById(user_id)
        console.log('user_id', user_id)
        try {
            const stages = [
                {
                    "$lookup": {
                        "from": 'tags',
                        "localField": "tags",
                        "foreignField": "_id",
                        "as": "tags"
                    }
                },
                // {
                //     "$addFields": {
                //         'isYourFavorite': 'test'
                //     }
                // },
                {
                    "$addFields": {
                        "isFavorite": {
                            "$size": {
                                "$filter": {
                                    "input": "$likes",
                                    "as": "item",
                                    "cond": { "$eq": ["$$item", ObjectId(user_id)] }
                                }
                            }
                        }
                    }
                }
            ]
            if (req.query.search) {
                let resampe = new RegExp(req.query.search, 'i');
                stages.push({
                    "$match": {
                        "$or": [
                            { "tags.name": { "$all": [resampe] } },
                            { "url": resampe },
                        ]
                    }
                })
            }
            const articles = await Article.aggregate(stages)
            res.status(StatusCodes.OK).json(articles)
        } catch (e) {
            next(e)
        }
    },
    update: async (req, res, next) => {
        try {
            const { _id, url, tags, description } = req.body
            const user = await User.findById(req.decoded.user._id)
            const article = await Article.findOneAndUpdate({
                _id: _id,
                user: user._id
            }, {
                url: url,
                description: description,
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
    },
    addLikes: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id } = req.body
            console.log(user, _id)
            const article = await Article.findOneAndUpdate({
                _id: _id,
                // user: user._id
            }, {
                $addToSet: { likes: user._id }
            }, {
                new: true,
            })
            const populated = await Article.findById(article._id).populate('tags')
            res.json(populated)
        } catch (e) {
            next(e)
        }
    }
}