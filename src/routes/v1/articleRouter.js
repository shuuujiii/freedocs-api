const express = require('express')
const router = express.Router()
const { StatusCodes } = require('http-status-codes')
const { validateToken } = require('../../middlewares/validator/jwtvalidator')
const ArticleValidator = require('../../middlewares/validator/articleValidator')
const TagValidator = require('../../middlewares/validator/tagValidator')
const articleController = require('../../controllers/articleController')
const { AppError } = require('../../utils/appError')

const validateParam = async (req, res, next) => {
    try {
        const { url, tags, description } = req.body
        const user_id = req.decoded.user._id
        await ArticleValidator.validateAsync({
            url: url,
            description: description,
            user: user_id,
            tags: tags
        })
            .catch(err => {
                throw new AppError(err.name, StatusCodes.BAD_REQUEST, err.message, true)
            });
        next()
    } catch (e) {
        next(e)
    }
}

router.post('/', validateToken, validateParam, articleController.create)

router.get('/all', articleController.readall)

router.get('/', validateToken, articleController.read)

router.put('/', validateToken, validateParam, articleController.update)

router.delete('/', validateToken, articleController.delete)

router.post('/tag', validateToken, articleController.addTags)

router.delete('/tag', validateToken, articleController.deleteTags)

router.post('/likes', validateToken, articleController.addLikes)

router.put('/tag', validateToken, articleController.updateTag)

module.exports = router