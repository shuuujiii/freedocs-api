const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const Likes = require('../models/likesModel')
const Good = require('../models/goodModel')
const Vote = require('../models/voteModel')
const User = require('../models/userModel')
const Comment = require('../models/commentModel')
const { AppError } = require('../utils/appError')
const ObjectId = require('mongoose').Types.ObjectId;
const jwt = require('jsonwebtoken');
const lookupLikes = [{
    $lookup: {
        from: 'likes',
        localField: "_id",
        foreignField: "article",
        as: "like"
    }
}, {
    $unwind: '$like',
},]

const lookupGood = [{
    $lookup: {
        from: 'goods',
        localField: "_id",
        foreignField: "article",
        as: "good"
    }
},
{
    $unwind: '$good',
}
]

const lookupUpvote = [{
    $lookup: {
        from: 'votes',
        localField: "_id",
        foreignField: "article",
        as: "votes"
    }
},
// { $unwind: '$votes' },
{
    $unwind: {
        path: "$votes",
        // "preserveNullAndEmptyArrays": true
    }
}
]

// const lookupTag = [
//     { $unwind: '$tags' },
//     {
//         $lookup: {
//             from: 'tags',
//             localField: "tags._id",
//             foreignField: "_id",
//             as: "tags.info"
//         }
//     },
//     { $unwind: '$tags.info' },
//     {
//         $group: {
//             _id: '$_id',
//             root: { $mergeObjects: '$$ROOT' },
//             tags: { $push: '$tags' }
//         }
//     },
//     {
//         $replaceRoot: {
//             newRoot: {
//                 $mergeObjects: ['$root', '$$ROOT']
//             }
//         }
//     }
// ]

const lookupTag = [
    {
        $lookup: {
            from: 'tags',
            localField: "tags",
            foreignField: "_id",
            as: "tags"
        }
    },
    // {
    //     $match: {
    //         'tags.name': 'add'
    //     }
    // },

    // {
    //     $lookup:
    //     {
    //         from: "tags",
    //         let: { article_tags: "$tags" },
    //         pipeline: [
    //             {
    //                 $match:
    //                 {
    //                     $expr:
    //                     {
    //                         $and:
    //                             [
    //                                 // { $eq: ["$name", "add"] },
    //                                 { $in: ["$name", ["add"]] },
    //                                 // { $in: ['cool']
    //                                 // { $eq: ["$$article_tags", "$_id"] }
    //                                 { $in: ["$_id", "$$article_tags"] }
    //                             ]

    //                     }
    //                 }
    //             }
    //         ],
    //         as: "tags"
    //     }
    // }

]


const lookupAuthorName = [{
    $lookup: {
        from: 'users',
        localField: "user",
        foreignField: "_id",
        as: "author"
    }
}, {
    $unwind: '$author',
},]

const articleProject = {
    $project: {
        // root: 1,
        'url': 1,
        'user': 1,
        'author': '$author.username',
        'description': 1,
        // 'good': "$good.users",
        'votes': 1,
        'likes': "$like.users",
        'tags': 1,
        'likeCount': { $size: "$like.users" },
        // 'goodCount': { $size: '$good.users' },
        'createdAt': 1,
        'updatedAt': 1,
    }
}

const aggregateLimit = (limit) => {
    return {
        $limit: limit
    }
}

const aggregateSort = (sortKey, order) => {
    return {
        $sort: {
            [sortKey]: order
        }
    }
}

const aggregateSearch = (search) => {
    let resampe = new RegExp(search, 'i');
    return {
        $match: {
            $or: [
                { "tags.name": { "$all": [resampe] } },
                { "url": resampe },
            ]
        }
    }
}

const tagFilter = (filter) => {
    return {
        $match: {
            'tags.name': { $in: [filter] }
        }
    }
}

const getBaseAggregateStage = (sortKey, order, search, tagfilter) => {
    let base = [
        ...lookupLikes,
        // ...lookupGood,
        ...lookupUpvote,
        ...lookupTag,
        ...lookupAuthorName,
        articleProject,
        aggregateSort(sortKey, order),

    ]
    if (tagfilter) {
        base.push(tagFilter(tagfilter))
    }
    if (search) {
        base.push(aggregateSearch(search))
    }

    return base
}

const getAggregateStageById = (_id) => {
    const matchId = {
        $match: {
            "_id": ObjectId(_id)
        }
    }
    let stage = [
        matchId,
        ...lookupLikes,
        ...lookupUpvote,
        ...lookupTag,
        ...lookupAuthorName,
        articleProject,
    ]

    return stage

}
module.exports = {
    create: async (req, res, next) => {
        try {
            const { url, tags, description } = req.body
            const user = await User.findById(req.decoded.user._id)
            const findArticle = await Article.findOne({ url: url }).lean()
            if (findArticle) {
                throw new AppError('AppError', StatusCodes.CONFLICT, 'sorry! this URL already exists', true)
            }
            const mapped = tags.map(tag => { return { locked: true, _id: tag } })
            const article = await Article.create({
                url: url,
                description: description,
                tags: mapped,
                user: user._id,
            })
            await Likes.create({
                users: [],
                article: article._id,
            })
            // const g = await Good.create({
            //     users: [],
            //     article: article._id,
            // })
            await Vote.create({
                upvoteUsers: [],
                donwvoteUsers: [],
                article: article._id,
            })
            const populated = await Article.findById(article._id).populate('tags')
            res.json(populated)
        } catch (e) {
            next(e)
        }
    },
    lists: async (req, res, next) => {
        try {
            // const user = req.decoded.user
            const page = req.query.page || 1
            const sortKey = req.query.sortkey || 'url'
            const tag = req.query.tag
            const username = req.query.username
            const favorite = req.query.favorite
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
            // const isFavorite = req.query.isFavoriteOnly
            const pagingOptions = {
                page: page,
                limit: 10,
            };

            let user
            if (username) {
                user = await User.findOne({ 'username': username })
            }

            const base = getBaseAggregateStage(sortKey, order, req.query.search, tag)
            const stages = [
                ...base,
            ]

            if (username) {
                user = await User.findOne({ 'username': username })
                stages.push({
                    $match: {
                        "user": user._id
                    }
                })
            }

            if (favorite) {
                user = await User.findOne({ 'username': favorite })
                stages.push({
                    $match: {
                        'likes': { $in: [user._id] }
                    }
                })
            }
            // const stages = getBaseAggregateStage(sortKey, order, req.query.search, tag)
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
                // url: url,
                description: description,
                tags: tags
            }, {
                new: true,
            })
            if (!article) {
                throw new AppError('AppError', StatusCodes.NO_CONTENT, 'there is no article on this request', true)
            }
            const stage = getAggregateStageById(article._id)
            const populated = await Article.aggregate(stage)
            res.json(populated[0])
            // const populated = await Article.findById(article._id).populate('tags')
            // res.json(populated)
        } catch (e) {
            next(e)
        }
    },
    delete: async (req, res, next) => {
        try {
            const { _id } = req.body
            const article = await Article.findOneAndRemove({
                _id: _id,
                user: req.decoded.user._id
            })

            await Likes.findOneAndRemove({
                article: _id,
            })

            await Vote.findOneAndRemove({
                article: _id,
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
            const { _id } = req.body
            const isLike = await Likes.findOne({ article: _id, users: { $in: [user._id] } })
            const update = isLike ? { $pull: { users: user._id } } : { $addToSet: { users: user._id } }
            const l = await Likes.findOneAndUpdate({
                article: _id,
            }, update, {
                upsert: true, new: true, setDefaultsOnInsert: true
            })
            const stage = getAggregateStageById(_id)
            const populated = await Article.aggregate(stage)
            res.json(populated[0])
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
            const result = await Comment.find({ article: article, parent: null })
            res.json(result)
        } catch (e) {
            next(e)
        }
    },
    getRank: async (req, res, next) => {
        try {
            const likesRanking = await Article.aggregate([
                ...lookupLikes,
                // ...lookupUpvote,
                {
                    "$project": {
                        "_id": 1,
                        "url": 1,
                        // 'like': 1,
                        'count': { $size: "$like.users" },
                    }
                },
                aggregateSort('count', -1),
                aggregateLimit(3),
            ])
            const voteRanking = await Article.aggregate([
                ...lookupUpvote,
                {
                    "$project": {
                        "_id": 1,
                        "url": 1,
                        // "votes": 1,
                        "count": { $subtract: [{ $size: '$votes.upvoteUsers' }, { $size: '$votes.downvoteUsers' }] },
                        'up': { $size: '$votes.upvoteUsers' },
                        'down': { $size: '$votes.downvoteUsers' },
                    }
                },
                aggregateSort('count', -1),
                aggregateLimit(3),
            ])
            res.json({ likesRanking: likesRanking, voteRanking: voteRanking })
        } catch (e) {
            next(e)
        }
    },
    upvote: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id } = req.body
            const isUpvoted = await Vote.findOne({ article: ObjectId(_id), upvoteUsers: { $in: [user._id] } })
            const update = isUpvoted ? {
                $pull: { upvoteUsers: user._id },
            } : {
                $addToSet: { upvoteUsers: user._id },
                $pull: { downvoteUsers: user._id },
            }
            await Vote.findOneAndUpdate(
                {
                    article: _id,
                }, update, {
                upsert: true, new: true, setDefaultsOnInsert: true
            })
            const stage = getAggregateStageById(_id)
            const populated = await Article.aggregate(stage)
            // res.json(populated[0])
            res.json(populated[0])
        } catch (e) {
            next(e)
        }
    },
    downvote: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id } = req.body
            const isDownVoted = await Vote.findOne({ article: ObjectId(_id), downvoteUsers: { $in: [user._id] } })
            const update = isDownVoted ? {
                $pull: { downvoteUsers: user._id },
            } : {
                $addToSet: { downvoteUsers: user._id },
                $pull: { upvoteUsers: user._id },
            }
            await Vote.findOneAndUpdate(
                {
                    article: _id,
                }, update, {
                upsert: true, new: true, setDefaultsOnInsert: true
            })
            const stage = getAggregateStageById(_id)
            const populated = await Article.aggregate(stage)
            // res.json(populated[0])
            res.json(populated[0])
        } catch (e) {
            next(e)
        }
    },
}