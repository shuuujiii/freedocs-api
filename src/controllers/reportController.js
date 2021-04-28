const { StatusCodes } = require('http-status-codes')
const User = require('../models/userModel')
const Report = require('../models/reportModel')
const { AppError } = require('../utils/appError')
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    report: async (req, res, next) => {
        try {
            const { id, title, detail } = req.body
            const user = req.decoded.user
            const report = await Report.create({
                article: id,
                title: title,
                detail: detail,
                user: user._id,
            })
            res.status(StatusCodes.OK).json({ id: id, title: title, detail: detail })
        } catch (e) {
            next(e)
        }

    }
}