const Tag = require('../models/tagModel')
const { AppError } = require('../utils/appError')
const { StatusCodes } = require('http-status-codes')
module.exports = {
    create: async (req, res, next) => {
        try {
            const { name } = req.body
            const isExistTag = await Tag.findOne({ name: name })
            console.log(isExistTag)
            if (isExistTag) {
                throw new AppError('AppError', StatusCodes.CONFLICT, 'already exist the tag name', true)
            }
            const tag = await Tag.create({ name: name })
            res.status(StatusCodes.CREATED).json(tag)
        } catch (e) {
            next(e)
        }

    },
    read: async (req, res, next) => {
        try {
            const { user_id } = req.decoded
            const tags = await Tag.find({})
            res.status(StatusCodes.OK).json(tags)
        } catch (e) {
            next(e)
        }
    },
    update: async (req, res, next) => {
        try {
            // const { user_id } = req.decoded
            const { _id, name } = req.body
            const tags = await Tag.findOneAndUpdate({
                _id: _id,
            }, {
                name: name
            }, {
                new: true
            })
            res.json(tags)
        } catch (e) {
            next(e)
        }
    },
    delete: async (req, res, next) => {
        try {
            // const { user_id } = req.decoded
            const { _id } = req.body
            const tag = await Tag.deleteOne({ _id: _id })
            res.json(tag)
        } catch (e) {
            next(e)
        }
    },
}