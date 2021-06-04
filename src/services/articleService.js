const User = require('../models/userModel')
const Article = require('../models/articleModel');
const Comment = require('../models/commentModel')
const bcrypt = require('bcrypt');
const Joi = require('joi')

const environment = process.env.NODE_ENV;
const stage = require('../configs/config.js')[environment];
const { AppError } = require('../utils/appError');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');
Joi.objectId = require('joi-objectid')(Joi)

// validation
const validateCreateArticle = async (payload) => {
    const ArticleValidator = Joi.object({
        url: Joi.string().uri().required(),
        description: Joi.string().allow(null).allow(''),
        user: Joi.objectId().required(),
        tags: Joi.array().items(Joi.objectId().allow(null)).required(),
    })
    await ArticleValidator.validateAsync(payload)
        .catch(err => {
            console.log('validate error', err.message)
            throw new AppError(err.name, StatusCodes.BAD_REQUEST, err.message, true)
        });
    return
}
const validateUpdateArticle = async (payload) => {
    const ArticleValidator = Joi.object({
        // url: Joi.string().uri().required(),
        description: Joi.string().allow(null).allow(''),
        // user: Joi.objectId().required(),
        tags: Joi.array().items(Joi.objectId().allow(null)).required(),
    })
    await ArticleValidator.validateAsync(payload)
        .catch(err => {
            console.log('validate error', err.message)
            throw new AppError(err.name, StatusCodes.BAD_REQUEST, err.message, true)
        });
    return
}

// check
const checkDuplicateUrl = async (url) => {
    const findArticle = await Article.findOne({ url: url }).lean()
    if (findArticle) {
        throw new AppError('AppError', StatusCodes.CONFLICT, 'sorry! this URL already exists', true)
    }
    return
}


const aggregateSort = (sortKey = 'createdAt', order = 'asc') => {
    return { $sort: { [sortKey]: order === 'asc' ? 1 : -1 } }
}

const getRecentlyPosted = async (limit = 3) => {
    return await Article.aggregate([
        {
            "$project": {
                "_id": 1,
                "url": 1,
                "createdAt": 1,
                "updatedAt": 1,
            }
        },
        aggregateSort('createdAt', 'desc'),
        { $limit: limit },
    ])
}

const getFavoriteRank = async (limit = 3) => {
    return await Article.aggregate([
        {
            "$project": {
                "_id": 1,
                "url": 1,
                'count': { $size: "$favoriteUsers" },
            }
        },
        aggregateSort('count', 'desc'),
        { $limit: limit },
    ])
}

const getVoteRank = async (limit = 3) => {
    return await Article.aggregate([
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

}

const createArticle = async (payload) => {
    await validateCreateArticle(payload)
    return await Article.create(payload)
}

const aggregatePaginate = async (stage, page) => {
    const pagingOptions = {
        page: page || 1,
        limit: 10,
    };

    return await Article.aggregatePaginate(stage, pagingOptions)
}

const updateArticle = async (find, payload) => {
    await validateUpdateArticle(payload)
    const article = await Article.findOneAndUpdate(find, payload, { new: true, })
    if (!article) {
        throw new AppError('AppError', StatusCodes.BAD_REQUEST, 'there is no article on this request', true)
    }
    return article
}

const deleteArticle = async (_id, user_id) => {
    const article = await Article.findOneAndRemove({
        _id: _id,
        user: user_id,
    })

    if (!article) {
        throw new AppError('AppError', StatusCodes.NO_CONTENT, 'there is no article on this request', true)
    }
    return article
}
const findArticleByIdWithTags = async (_id) => {
    return await Article.findById(_id).populate('tags')
}

module.exports = {
    getRecentlyPosted,
    getFavoriteRank,
    getVoteRank,
    aggregatePaginate,
    createArticle,
    updateArticle,
    deleteArticle,
    checkDuplicateUrl,
    findArticleByIdWithTags,
}
