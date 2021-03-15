const express = require('express')
const router = express.Router()
const tagController = require('../../controllers/tagController')
const { validateToken } = require('../../middlewares/validator/jwtvalidator')
const TagValidator = require('../../middlewares/validator/tagValidator')
const { AppError } = require('../../utils/appError')
const { StatusCodes } = require('http-status-codes')
const validateParam = async (req, res, next) => {
    try {
        const { name } = req.body
        await TagValidator.validateAsync({ name: name })
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
        const { _id } = req.body
        await TagValidator.validateAsync({ _id: _id })
            .catch(e => {
                throw new AppError(e.name, StatusCodes.BAD_REQUEST, e.message, true)
            })
        next()
    } catch (e) {
        next(e)
    }
}

const validateAdminUser = async (req, res, next) => {
    try {
        const { admin } = req.decoded.user
        if (!admin) {
            throw new AppError('AppError', StatusCodes.UNAUTHORIZED, 'only admin user can do that', true)
        }
        next()
    } catch (e) {
        next(e)
    }
}
router.post('/', validateToken, validateParam, tagController.create)
router.get('/', validateToken, tagController.read)
router.put('/', validateToken, validateAdminUser, validateParam, tagController.update)
router.delete('/', validateToken, validateAdminUser, validateDeleteParam, tagController.delete)

module.exports = router