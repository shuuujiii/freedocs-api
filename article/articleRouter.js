const express = require('express')
const router = express.Router()
const { StatusCodes } = require('http-status-codes')
const { validateToken } = require('../utils/jwtvalidation')
const ArticleValidator = require('./articleValidator')
const articleController = require('./articleController')
const { AppError } = require('../appError')

const validateParam = async (req, res, next) => {
    try {
        const { title, url } = req.body
        const user_id = req.decoded.user_id
        await ArticleValidator.validateAsync({ title: title, url: url, user: user_id })
            .catch(err => {
                throw new AppError(err.name, StatusCodes.BAD_REQUEST, err.message, true)
            });
        next()
    } catch (e) {
        next(e)
    }
}
router.post('/', validateToken, validateParam, articleController.create)

router.get('/', validateToken, articleController.read)

router.put('/', validateToken, validateParam, articleController.update)

router.delete('/', validateToken, articleController.delete)

module.exports = router