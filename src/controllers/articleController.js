const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const Comment = require('../models/commentModel')
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
                likes: [],
                good: [],
                bad: [],
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
        // const token = () => {
        //     if (req.session && req.session.token) { return req.session.token };
        //     const authorizationHeader = req.headers.authorization;
        //     if (!authorizationHeader) {
        //         return null
        //     }
        //     return req.headers.authorization.split(' ')[1]; // Bearer <token>)
        // };
        // const options = {
        //     expiresIn: '2d',
        //     issuer: 'shuji watanabe'
        // };
        // // verify makes sure that the token hasn't expired and has been issued by us
        // let decoded = null
        // try {
        //     decoded = jwt.verify(token(), process.env.JWT_SECRET, options);
        // } catch {

        // }
        // let user_id = null
        // if (decoded) {
        //     user_id = decoded.user._id
        // }
        try {
            const page = req.query.page || 1
            // console.log('req.query.sort', req.query.sort)
            const sortKey = req.query.sortkey || 'url'
            const order = (function (order) {
                if (!order) {
                    return 1
                }
                if (order === 'asc') {
                    return 1
                }
                if (order === 'desc') {
                    return -1
                }
                return 1
            })(req.query.order)
            // const order = req.query.order || 1
            // console.log('page', page)
            const pagingOptions = {
                page: page,
                limit: 10,
            };

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
                //     "$match": {
                //         "tags._id": {
                //             "$exists": true
                //         }
                //     }
                // },
                //sort 
                {
                    '$sort': {
                        [sortKey]: order
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
                        ]
                    }
                })
            }
            const articleAggregate = Article.aggregate(stages)
            const paginated = await Article.aggregatePaginate(articleAggregate, pagingOptions)
            // return
            res.status(StatusCodes.OK).json(paginated)
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
    // deleteTags: async (req, res, next) => {
    //     try {
    //         const user = await User.findById(req.decoded.user._id)
    //         const { _id, tags } = req.body
    //         const tag_ids = tags.map(tag => tag._id)
    //         const article = await Article.findOneAndUpdate(
    //             { _id: _id, user: user._id },
    //             { $pullAll: { tags: tag_ids } },
    //             { new: true }
    //         )
    //         res.json(article)
    //     } catch (e) {
    //         next(e)
    //     }
    // },
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
    likes: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id, likes } = req.body
            const update = likes ? { $addToSet: { likes: user._id } } : { $pull: { likes: user._id } }
            const article = await Article.findOneAndUpdate({
                _id: _id,
            }, update, {
                new: true,
            })
            const populated = await Article.findById(_id).populate('tags')
            res.json(populated)
        } catch (e) {
            next(e)
        }
    },
    good: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id, good } = req.body
            const update = good ? { $addToSet: { good: user._id }, $pull: { bad: user._id } } : { $pull: { good: user._id } }
            const article = await Article.findOneAndUpdate({
                _id: _id,
            }, update, {
                new: true,
            })
            const populated = await Article.findById(_id).populate('tags')
            res.json(populated)
        } catch (e) {
            next(e)
        }
    },
    bad: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id, bad } = req.body
            const update = bad ? { $addToSet: { bad: user._id }, $pull: { good: user._id } } : { $pull: { bad: user._id } }
            const article = await Article.findOneAndUpdate({
                _id: _id,
            }, update, {
                new: true,
            })
            const populated = await Article.findById(_id).populate('tags')
            res.json(populated)
        } catch (e) {
            next(e)
        }
    },
    addComment: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { article_id, parent_id, comment } = req.body
            const parent = await Comment.findById(parent_id).select('depth')
            depth = parent ? parent.depth + 1 : 1

            const createdComment = await Comment.create(
                {
                    article: article_id,
                    comment: comment,
                    user: user._id,
                    parent: parent_id,
                    children: [],
                    depth: depth
                }
            )
            const updatedParent = await Comment.findByIdAndUpdate(createdComment.parent, {
                $push: {
                    children: createdComment._id
                }
            })
            const result = await Comment.find({ article: article_id, parent: null })
            res.status(StatusCodes.OK).json(result)
        } catch (e) {
            next(e)
        }
    },
    getComment: async (req, res, next) => {
        try {
            const { article } = req.query
            console.log('article', article)
            const result = await Comment.find({ article: article, parent: null })
            res.json(result)
        } catch (e) {
            next(e)
        }
    }
}