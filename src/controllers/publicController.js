const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const { AppError } = require('../utils/appError')

module.exports = {
    read: async (req, res, next) => {
        try {
            const articles = await Article.aggregate([
                { $unwind: '$tags' },
                // get tag count
                {
                    $group: {
                        _id: {
                            'url': '$url',
                            'tag_id': '$tags'
                        },
                        users: {
                            $addToSet: '$user',
                        },
                        count: { $sum: 1 }
                    }
                },
                // get tag data ref
                {
                    $lookup: {
                        from: "tags",
                        localField: "_id.tag_id",
                        foreignField: "_id",
                        as: "tagdoc"
                    }
                },
                // make url group
                {
                    $group: {
                        _id: { 'url': '$_id.url' },
                        tags: {
                            $push: {
                                tag: { "$arrayElemAt": ["$tagdoc", 0] },
                                tagcount: '$count'
                            }
                        },
                        users: {
                            $addToSet: '$users'
                        }
                    }
                },
                // fix user array to one dimention array
                {
                    $project: {
                        _id: 1,
                        tags: 1,
                        users: {
                            $reduce: {
                                input: '$users',
                                initialValue: [],
                                in: {
                                    $concatArrays: ["$$value", "$$this"]
                                }
                            }
                        }
                    }
                },
                // delete duplicate user id
                {
                    $project: {
                        _id: 1,
                        tags: 1,
                        user_ids: {
                            $reduce: {
                                input: '$users',
                                initialValue: [],
                                in: {
                                    $cond: [
                                        { $in: ["$$this", "$$value"] }, /** Check if 'id' exists in holding array if yes push same array or concat holding array with & array of new object */
                                        "$$value",
                                        { $concatArrays: ["$$value", ["$$this"]] }

                                    ]
                                }
                            }
                        }
                    }
                },
                // get user data ref
                {
                    $lookup: {
                        from: "users",
                        localField: "user_ids",
                        foreignField: "_id",
                        as: "users"
                    }
                },
            ])

            res.json(articles)
        } catch (e) {
            next(e)
        }
    },
}