const express = require('express')
const router = express.Router()
const tagController = require('../../controllers/tagController')
const { validateToken } = require('../../middlewares/validator/jwtvalidator')
const tagValidator = require('../../middlewares/validator/tagValidator')
const { AppError } = require('../../utils/appError')
const { StatusCodes } = require('http-status-codes')
const validateParam = async (req, res, next) => {
    try {
        const { user_id } = req.decoded
        const { name } = req.body
        await tagValidator.checkAllKeys.validateAsync({ name: name, user: user_id })
            .catch(e => {
                throw new AppError(e.name, StatusCodes.BAD_REQUEST, e.message, true)
            })
        next()
    } catch (e) {
        next(e)
    }
}

const validateDeleteParam = async (req, res, next) => {
    try {
        const { user_id } = req.decoded
        const { _id } = req.body
        await tagValidator.checkId.validateAsync({ _id: _id, user: user_id })
            .catch(e => {
                throw new AppError(e.name, StatusCodes.BAD_REQUEST, e.message, true)
            })
        next()
    } catch (e) {
        next(e)
    }
}
router.post('/', validateToken, validateParam, tagController.create)
router.get('/', validateToken, tagController.read)
router.put('/', validateToken, validateParam, tagController.update)
router.delete('/', validateToken, validateDeleteParam, tagController.delete)

module.exports = router