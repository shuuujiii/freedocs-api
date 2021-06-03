const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const ArticleService = require('../services/articleService')
const UserService = require('../services/userService')

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
            const recentlyPosted = await ArticleService.getRecentlyPosted()
            const likesRanking = await ArticleService.getFavoriteRank()
            const voteRanking = await ArticleService.getVoteRank()
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
            const user = await UserService.findUserById(req.decoded.user._id)
            await ArticleService.checkDuplicateUrl(url)
            const payload = {
                url: url,
                description: description,
                tags: tags,
                user: user._id.toString(),
            }
            const article = await ArticleService.createArticle(payload)
            const populated = await ArticleService.findArticleByIdWithTags(article._id)
            res.status(StatusCodes.CREATED).json(populated)
        } catch (e) {
            next(e)
        }
    },
    update: async (req, res, next) => {
        try {
            const { _id, tags, description } = req.body
            const user = await UserService.findUserById(req.decoded.user._id)
            const payload = { description: description, tags: tags }
            const article = await ArticleService.updateArticle({ _id: _id, user: user._id }, payload)
            const populated = await ArticleService.findArticleByIdWithTags(article._id)
            res.json(populated)
        } catch (e) {
            next(e)
        }
    },
    delete: async (req, res, next) => {
        try {
            const { _id } = req.body
            const user_id = req.decoded.user._id
            const deletedArticle = await ArticleService.deleteArticle(_id, user_id)
            res.json(deletedArticle)
        } catch (e) {
            next(e)
        }
    },

}