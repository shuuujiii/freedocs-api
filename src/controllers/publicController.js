const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const { AppError } = require('../utils/appError')

module.exports = {
    read: async (req, res, next) => {
        try {
            const stages = [
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
                },]



            stages.push(
                // make url group
                {
                    $group: {
                        _id: { 'url': '$_id.url' },
                        tags: {
                            $push: {
                                _id: { "$arrayElemAt": ["$tagdoc._id", 0] },
                                name: { "$arrayElemAt": ["$tagdoc.name", 0] },
                                count: '$count'
                            }
                        },
                        users: {
                            $addToSet: '$users'
                        }
                    }
                },
            )
            if (req.query.search) {
                let resampe = new RegExp(req.query.search, 'i');
                stages.push(
                    {
                        "$match": {
                            "$or": [
                                { "tags.name": { "$all": [resampe] } },
                                { "_id.url": resampe },
                            ]
                        }
                    },
                )
            }
            stages.push(
                // delete duplicate user id
                {
                    $project: {
                        _id: 1,
                        tags: 1,
                        user_ids: {
                            $reduce: {
                                input: {
                                    // get all user id ( duplicated) this $users structure is like [[1,2,3],[1,2],[1]]
                                    $reduce: {
                                        input: '$users',
                                        initialValue: [],
                                        in: {
                                            $concatArrays: ["$$value", "$$this"]
                                        }
                                    }
                                },
                                initialValue: [],
                                // remove duplicate user id
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
                //result
                {
                    $project: {
                        "_id": 1,
                        'tags': 1,
                        "users.username": 1,
                    }
                }
            )
            const articles = await Article.aggregate(stages)

            res.json(articles)
        } catch (e) {
            next(e)
        }
    },
}