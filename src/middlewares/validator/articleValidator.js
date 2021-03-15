const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const ArticleValidator = Joi.object({
    title: Joi.string().required(),
    url: Joi.string().uri().required(),
    user: Joi.string().required(),
    tags: Joi.array().items(Joi.objectId().allow(null)).required()
})
module.exports = ArticleValidator