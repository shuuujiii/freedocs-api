const { StatusCodes } = require('http-status-codes')
const Article = require('../models/articleModel')
const User = require('../models/userModel')
const ArticleService = require('../services/articleService')
const UserService = require('../services/userService')
const Comment = require('../models/commentModel')
const ObjectId = require('mongoose').Types.ObjectId;
module.exports = {
    getComment: async (req, res, next) => {
        try {
            const { article } = req.query
            const result = await Comment.find({ article: article, parent: null })
            res.json(result)
        } catch (e) {
            next(e)
        }
    },
    addComment: async (req, res, next) => {
        try {
            const user = await User.findById(req.decoded.user._id)
            const { article_id, parent_id, comment } = req.body
            const parent = await Comment.findById(parent_id).select('depth')
            depth = parent ? parent.depth + 1 : 1

            const createdComment = await Comment.create(
                {
                    article: article_id,
                    comment: comment,
                    user: user._id,
                    parent: parent_id,
                    children: [],
                    depth: depth
                }
            )
            const updatedParent = await Comment.findByIdAndUpdate(createdComment.parent, {
                $push: {
                    children: createdComment._id
                }
            })
            const result = await Comment.find({ article: article_id, parent: null })
            res.status(StatusCodes.OK).json(result)
        } catch (e) {
            next(e)
        }
    },


}