const express = require('express')
const router = express.Router()
const { StatusCodes } = require('http-status-codes')
const { validateToken } = require('../../middlewares/validator/jwtvalidator')
// const ArticleValidator = require('../../middlewares/validator/articleValidator')
// const TagValidator = require('../../middlewares/validator/tagValidator')
const articleController = require('../../controllers/articleController')
const commentController = require('../../controllers/commentController')
const { AppError } = require('../../utils/appError')
const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const ArticleValidator = Joi.object({
    url: Joi.string().uri().required(),
    description: Joi.string().allow(null).allow(''),
    user: Joi.string().required(),
    tags: Joi.array().items(Joi.objectId().allow(null)).required(),
    // likes: Joi.array().items(Joi.objectId().allow(null)).required(),
    // good: Joi.array().items(Joi.objectId().allow(null)).required(),
})
const validateParam = async (req, res, next) => {
    try {
        const { tags, description, url } = req.body
        const user_id = req.decoded.user._id
        await ArticleValidator.validateAsync({
            url: url,
            description: description,
            user: user_id,
            tags: tags,
        })
            .catch(err => {
                throw new AppError(err.name, StatusCodes.BAD_REQUEST, err.message, true)
            });
        next()
    } catch (e) {
        next(e)
    }
}
router.get('/lists', articleController.lists)
router.get('/ranking', articleController.getRank)

router.post('/create', validateToken, validateParam, articleController.create)
router.put('/update', validateToken, articleController.update)
router.delete('/delete', validateToken, articleController.delete)

router.post('/likes', validateToken, articleController.likes)
router.post('/upvote', validateToken, articleController.upvote)
router.post('/downvote', validateToken, articleController.downvote)

router.get('/comment', commentController.getComment)
router.post('/comment', validateToken, commentController.addComment)







module.exports = router