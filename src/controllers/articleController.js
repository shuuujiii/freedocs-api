const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const ArticleService = require('../services/articleService')
const UserService = require('../services/userService')
const { AppError } = require('../utils/appError')

const aggregateLimit = (limit) => { return { $limit: limit } }
const aggregateSort = (sortKey = 'createdAt', order = 'asc') => {
    console.log(sortKey, order)
    return { $sort: { [sortKey]: order === 'asc' ? 1 : -1 } }
}
const regexSearch = (search) => {
    if (!search) { return [] }
    let regex = new RegExp(search, 'i');
    return [{
        $match: {
            $or: [
                { "tags.name": { "$all": [regex] } },
                { "url": regex },
            ]
        }
    }]
}
const searchTag = (name) => {
    if (!name) { return [] }
    return [{ $match: { 'tags.name': { $in: [name] } } }]
}
const searchUserFavorite = async (username) => {
    if (username) {
        user = await User.findOne({ 'username': username })
        return [{
            $match: {
                'favoriteUsers': { $in: [user._id] }
            }
        }]
    }
    return []
}
const searchAuthor = async (author) => {
    if (author) {
        user = await User.findOne({ 'username': author })
        return [{
            $match: {
                "user": user._id
            }
        }]
    }
    return []
}

module.exports = {
    getPosts: async (req, res, next) => {
        try {
            const { page, sortKey, order, search, tag, author, favorite, } = req.query
            const pagingOptions = {
                page: page || 1,
                limit: 10,
            };
            const lookupTag = {
                $lookup: {
                    from: 'tags',
                    localField: "tags",
                    foreignField: "_id",
                    as: "tags"
                }
            }
            const lookupAuthor = [
                {
                    $lookup: {
                        from: 'users',
                        localField: "user",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                { $unwind: '$author' }
            ]
            const pipSearch = regexSearch(search)
            const pipSearchTag = searchTag(tag)
            const pipSearchUserFavorite = await searchUserFavorite(favorite)
            const pipSearchAuthor = await searchAuthor(author)
            const articleAggregate = Article.aggregate([
                lookupTag,
                ...lookupAuthor,
                ...pipSearch,
                ...pipSearchTag,
                ...pipSearchUserFavorite,
                ...pipSearchAuthor,
                {
                    $project: {
                        _id: 1,
                        tags: 1,
                        url: 1,
                        description: 1,
                        favoriteUsers: 1,
                        upvoteUsers: 1,
                        downvoteUsers: 1,
                        user: 1,
                        author: "$author.username",
                        favorite: { $size: "$favoriteUsers" },
                        vote: { $subtract: [{ $size: '$upvoteUsers' }, { $size: '$downvoteUsers' }] },
                        createdAt: 1,
                        updatedAt: 1,
                    }
                },
                aggregateSort(sortKey, order),
            ])
            const paginated = await Article.aggregatePaginate(articleAggregate, pagingOptions)
            res.json(paginated)
        } catch (e) {
            next(e)
        }
    },

    getRank: async (req, res, next) => {
        try {
            const recentlyPosted = await Article.aggregate([
                {
                    "$project": {
                        "_id": 1,
                        "url": 1,
                        "createdAt": 1,
                        "updatedAt": 1,
                    }
                },
                aggregateSort('createdAt', 'desc'),
                { $limit: 3 },
            ])
            const likesRanking = await Article.aggregate([
                {
                    "$project": {
                        "_id": 1,
                        "url": 1,
                        'count': { $size: "$favoriteUsers" },
                    }
                },
                aggregateSort('count', 'desc'),
                { $limit: 3 },
            ])
            const voteRanking = await Article.aggregate([
                {
                    "$project": {
                        "_id": 1,
                        "url": 1,
                        "count": { $subtract: [{ $size: '$upvoteUsers' }, { $size: '$downvoteUsers' }] },
                        'up': { $size: '$upvoteUsers' },
                        'down': { $size: '$downvoteUsers' },
                    }
                },
                aggregateSort('count', 'desc'),
                // aggregateSort('count', -1),
                { $limit: 3 },
            ])
            res.json({
                recentlyPosted: recentlyPosted,
                likesRanking: likesRanking,
                voteRanking: voteRanking
            })
        } catch (e) {
            next(e)
        }
    },
    create: async (req, res, next) => {
        try {
            const { url, tags, description } = req.body
            const user = await User.findById(req.decoded.user._id)
            const findArticle = await Article.findOne({ url: url }).lean()
            if (findArticle) {
                throw new AppError('AppError', StatusCodes.CONFLICT, 'sorry! this URL already exists', true)
            }
            const article = await Article.create({
                url: url,
                description: description,
                tags: tags,
                user: user._id,
            })
            const populated = await Article.findById(article._id).populate('tags')
            res.status(StatusCodes.CREATED).json(populated)
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
            const populated = await Article.findById(article._id)
                .populate('tags')
            res.json(populated)
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

            if (!article) {
                throw new AppError('AppError', StatusCodes.NO_CONTENT, 'there is no article on this request', true)
            }
            res.json(article)
        } catch (e) {
            next(e)
        }
    },

}