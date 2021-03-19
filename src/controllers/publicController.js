const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const { AppError } = require('../utils/appError')

module.exports = {
    read: async (req, res, next) => {
        try {
            const articles = await Article.aggregate([
                { $unwind: '$tags' },
                {
                    $group: {
                        _id: {
                            'url': '$url',
                            'tag_id': '$tags'
                        },
                        count: { $sum: 1 }
                    },
                },
                {
                    $lookup: {
                        from: "tags",
                        localField: "_id.tag_id",
                        foreignField: "_id",
                        as: "tagdoc"
                    }
                },
                {
                    $group: {
                        _id: { 'url': '$_id.url' },
                        tags: {
                            $push: {
                                tag: { "$arrayElemAt": ["$tagdoc", 0] },
                                tagcount: '$count'
                            }
                        }
                    }
                },
            ])

            res.json(articles)
        } catch (e) {
            next(e)
        }
    },
}