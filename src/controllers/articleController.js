const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const ArticleService = require('../services/articleService')
const UserService = require('../services/userService')

const getPipeSort = (sortKey = 'createdAt', order = 'asc') => {
    return { $sort: { [sortKey]: order === 'asc' ? 1 : -1 } }
}
const getPipesSearch = (search) => {
    let regex = new RegExp(search, 'i');
    return search ? [{
        $match: {
            $or: [
                { "tags.name": { "$all": [regex] } },
                { "url": regex },
                { "description": regex },
            ]
        }
    }] : []
}
const getPipesUserFavorite = async (username) => {
    if (!username) return []
    const user = await UserService.findUserByUsername(username)
    return [{
        $match: {
            'favoriteUsers': { $in: [user._id] }
        }
    }]
}

const getPipesTag = (name) => {
    const stage = [{
        $lookup: {
            from: 'tags',
            localField: "tags",
            foreignField: "_id",
            as: "tags"
        }
    }]

    if (name) {
        stage.push({ $match: { 'tags.name': { $in: [name] } } })
    }
    return stage
}

const getPipesUser = (username) => {
    const stage = [
        {
            $lookup: {
                from: 'users',
                localField: "user",
                foreignField: "_id",
                as: "author"
            }
        },
        { $unwind: '$author' },
    ]
    if (username) {
        stage.push({
            $match: {
                $expr: {
                    $eq: [
                        '$author.username',
                        username,
                    ]
                }
            }
        })
    }

    return stage
}

const getPipeProject = () => ({
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
        favorite: { $size: '$favoriteUsers' },
        vote: { $subtract: [{ $size: '$upvoteUsers' }, { $size: '$downvoteUsers' }] },
        createdAt: 1,
        updatedAt: 1,
    }
})
module.exports = {
    getPosts: async (req, res, next) => {
        try {
            const { page, sortKey, order, search, tag, author, favorite, } = req.query
            const pipesLookupTag = getPipesTag(tag)
            const pipesLookupAuthor = getPipesUser(author)
            const pipesSearch = getPipesSearch(search)
            const pipesUserFavorite = await getPipesUserFavorite(favorite)
            const stage = [
                ...pipesLookupTag,
                ...pipesLookupAuthor,
                ...pipesSearch,
                ...pipesUserFavorite,
                getPipeProject(),
                getPipeSort(sortKey, order),
            ]
            const paginated = await ArticleService.aggregatePaginate(Article.aggregate(stage), page)
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