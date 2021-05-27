const Favorite = require('../models/likesModel')
const User = require('../models/userModel')
const { StatusCodes } = require('http-status-codes')
const { AppError } = require('../utils/appError')
module.exports = {
    getFavorite: async (req, res, next) => {
        try {
            const { article_id } = req.query
            const result = await Favorite.findOne({ article: article_id })
            res.json(result)
        } catch (e) {
            next(e)
        }
    },
    invertFav: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            if (!user) {
                throw new AppError('AppError', StatusCodes.NO_CONTENT, 'user not found', true)
            }
            const { _id } = req.body
            const isLike = await Favorite.findOne({ article: _id, users: { $in: [user._id] } })
            const update = isLike ? { $pull: { users: user._id } } : { $addToSet: { users: user._id } }
            const favorite = await Favorite.findOneAndUpdate({
                article: _id,
            }, update, {
                upsert: true, new: true, setDefaultsOnInsert: true
            })
            // const stage = getAggregateStageById(_id)
            // const populated = await Article.aggregate(stage)
            res.json({
                article: favorite.article,
                users: favorite.users,
            })
        } catch (e) {
            next(e)
        }
    },
}