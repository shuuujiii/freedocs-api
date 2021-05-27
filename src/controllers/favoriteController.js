// const Favorite = require('../models/likesModel')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const { StatusCodes } = require('http-status-codes')
const { AppError } = require('../utils/appError')
module.exports = {
    invertFav: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            if (!user) {
                throw new AppError('AppError', StatusCodes.NO_CONTENT, 'user not found', true)
            }
            const { _id } = req.body
            const isLike = await Article.findOne({ _id: _id, favoriteUsers: { $in: [user._id] } })
            const update = isLike ? { $pull: { favoriteUsers: user._id } } : { $addToSet: { favoriteUsers: user._id } }
            const updatedArticle = await Article.findOneAndUpdate({
                _id: _id,
            }, update, {
                upsert: true, new: true, setDefaultsOnInsert: true
            })
            console.log('updatedArticle favorite', updatedArticle)
            res.json(updatedArticle)
        } catch (e) {
            next(e)
        }
    },
}