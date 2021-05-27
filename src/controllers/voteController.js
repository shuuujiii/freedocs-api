// const Vote = require('../models/voteModel')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const { StatusCodes } = require('http-status-codes')
const { AppError } = require('../utils/appError')

module.exports = {
    upvote: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id } = req.body
            const isUpvoted = await Article.findOne({ _id: _id, upvoteUsers: { $in: [user._id] } })
            const update = isUpvoted ? {
                $pull: { upvoteUsers: user._id },
            } : {
                $addToSet: { upvoteUsers: user._id },
                $pull: { downvoteUsers: user._id },
            }
            const result = await Article.findOneAndUpdate(
                {
                    _id: _id,
                }, update, {
                upsert: true, new: true, setDefaultsOnInsert: true
            })
            res.json(result)
        } catch (e) {
            next(e)
        }
    },
    downvote: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { _id } = req.body
            const isDownVoted = await Article.findOne({ _id: _id, downvoteUsers: { $in: [user._id] } })
            const update = isDownVoted ? {
                $pull: { downvoteUsers: user._id },
            } : {
                $addToSet: { downvoteUsers: user._id },
                $pull: { upvoteUsers: user._id },
            }
            const result = await Article.findOneAndUpdate(
                {
                    _id: _id,
                }, update, {
                upsert: true, new: true, setDefaultsOnInsert: true
            })
            // const stage = getAggregateStageById(_id)
            // const populated = await Article.aggregate(stage)
            // res.json(populated[0])
            res.json(result)
        } catch (e) {
            next(e)
        }
    },
}