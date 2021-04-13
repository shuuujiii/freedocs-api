const express = require('express')
const router = express.Router()
const { StatusCodes } = require('http-status-codes')
const { validateToken } = require('../../middlewares/validator/jwtvalidator')
// const ArticleValidator = require('../../middlewares/validator/articleValidator')
// const TagValidator = require('../../middlewares/validator/tagValidator')
const articleController = require('../../controllers/articleController')
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
        const { url, tags, description } = req.body
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

router.post('/', validateToken, validateParam, articleController.create)

router.get('/all', articleController.readall)

router.get('/', validateToken, articleController.read)

router.put('/', validateToken, validateParam, articleController.update)

router.delete('/', validateToken, articleController.delete)

router.post('/tag', validateToken, articleController.addTags)

// router.delete('/tag', validateToken, articleController.deleteTags)

router.post('/likes', validateToken, articleController.likes)
router.post('/good', validateToken, articleController.good)
router.post('/bad', validateToken, articleController.bad)

router.put('/tag', validateToken, articleController.updateTag)

router.get('/comment', articleController.getComment)

router.post('/comment', validateToken, articleController.addComment)

module.exports = router